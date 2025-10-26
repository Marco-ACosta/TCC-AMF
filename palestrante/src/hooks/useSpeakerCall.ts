"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { createSignalingClient } from "@/services/webrtc/signaling";
import { startAudioMeter } from "@/utils/meter";

import type {
  RoomDetails,
  Translator,
  MemberMeta,
  RoomInfoPayload,
} from "@/types/room";
import RoomService from "@/services/api/roomService";
import { chooseBestSourceLanguage } from "@/utils/chooseBestSourceLanguage";

type PeerKey = string | number;

type UseSpeakerCallOptions = {
  roomCode: string;
  meId?: string | null;
  signalingURL: string;
  signalingPath?: string;
  iceServers?: RTCIceServer[];
};

type UseSpeakerCallReturn = {
  details: RoomDetails | null;
  micLevel: number;
  autoSrc: string;
  joinSubRoom: (src: string) => void;
};

export function useSpeakerCall({
  roomCode,
  meId = null,
  signalingURL,
  signalingPath = "/signal",
  iceServers = [],
}: UseSpeakerCallOptions): UseSpeakerCallReturn {
  const socketRef = useRef<Socket | null>(null);

  const pcsRef = useRef<Map<PeerKey, RTCPeerConnection>>(new Map());
  const connectedPeersRef = useRef<Set<PeerKey>>(new Set());
  const iceQueueRef = useRef<Map<PeerKey, RTCIceCandidateInit[]>>(new Map());
  const peerReadyRef = useRef<Set<PeerKey>>(new Set());

  const micStreamRef = useRef<MediaStream | null>(null);
  const meterStopRef = useRef<(() => void) | null>(null);

  const [details, setDetails] = useState<RoomDetails | null>(null);
  const [autoSrc, setAutoSrc] = useState<string>("");
  const [micLevel, setMicLevel] = useState<number>(0);

  const membersRef = useRef<MemberMeta[]>([]);
  const joinedSubRoomRef = useRef<string>("");
  const dialTimerRef = useRef<number | null>(null);

  const getPeerKey = (m: Pick<MemberMeta, "id" | "sid">) => m.sid ?? m.id;

  const startMicMeter = useCallback((stream: MediaStream) => {
    meterStopRef.current?.();
    meterStopRef.current = startAudioMeter(stream, (level) =>
      setMicLevel(level)
    );
  }, []);

  const ensureMic = useCallback(async (): Promise<MediaStream> => {
    if (micStreamRef.current) return micStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    micStreamRef.current = stream;
    startMicMeter(stream);
    return stream;
  }, [startMicMeter]);

  const getOrCreatePC = useCallback(
    (peerKey: PeerKey) => {
      let pc = pcsRef.current.get(peerKey);
      if (pc) return pc;

      pc = new RTCPeerConnection({ iceServers });
      pcsRef.current.set(peerKey, pc);

      pc.onicecandidate = (evt) => {
        if (!evt.candidate) return;
        const cand = (evt.candidate as any).toJSON?.() ?? evt.candidate;
        if (!peerReadyRef.current.has(peerKey)) {
          const q = iceQueueRef.current.get(peerKey) ?? [];
          q.push(cand);
          iceQueueRef.current.set(peerKey, q);
          return;
        }
        socketRef.current?.emit("ice-candidate", {
          room: joinedSubRoomRef.current || roomCode,
          to: peerKey,
          candidate: cand,
        });
      };

      pc.onconnectionstatechange = () => {
        const st = pc!.connectionState;
        if (st === "failed" || st === "disconnected" || st === "closed") {
          try {
            pc!.close();
          } catch {}
          pcsRef.current.delete(peerKey);
          connectedPeersRef.current.delete(peerKey);
          peerReadyRef.current.delete(peerKey);
          iceQueueRef.current.delete(peerKey);
        }
        if (st === "connected") connectedPeersRef.current.add(peerKey);
      };

      return pc;
    },
    [iceServers, roomCode]
  );

  const callReceiver = useCallback(
    async (target: MemberMeta) => {
      if (!joinedSubRoomRef.current) return;
      const peerKey = getPeerKey(target);
      if (connectedPeersRef.current.has(peerKey)) return;

      try {
        const pc = getOrCreatePC(peerKey);

        const mic = await ensureMic();
        const hasAudio = pc.getSenders().some((s) => s.track?.kind === "audio");
        if (!hasAudio) mic.getAudioTracks().forEach((t) => pc.addTrack(t, mic));

        const offer = await pc.createOffer({ offerToReceiveAudio: false });
        await pc.setLocalDescription(offer);

        socketRef.current?.emit("offer", {
          room: joinedSubRoomRef.current,
          to: peerKey,
          sdp: offer.sdp,
          type: offer.type,
          meta: {
            src: autoSrc,
            from_role: "speaker",
            me: { id: meId ?? undefined },
          },
        });
      } catch {}
    },
    [ensureMic, getOrCreatePC, meId, autoSrc]
  );

  const dialEligibleReceivers = useCallback(() => {
    if (!joinedSubRoomRef.current) return;
    const list = membersRef.current || [];

    const relays = list.filter((m) => m.role === "relay");
    const usersOriginal = list.filter(
      (m) =>
        m.role === "user" &&
        ((m as any).tgt === autoSrc || (!(m as any).tgt && autoSrc))
    );

    const targets = [...relays, ...usersOriginal];
    targets.forEach((m) => {
      const key = getPeerKey(m);
      if (!connectedPeersRef.current.has(key)) callReceiver(m);
    });
  }, [callReceiver, autoSrc]);

  const joinSubRoom = useCallback(
    (src: string) => {
      const target = src ? `${roomCode}::${src}` : roomCode;
      if (!socketRef.current) return;

      if (joinedSubRoomRef.current) {
        try {
          socketRef.current.emit("leave", { room: joinedSubRoomRef.current });
        } catch {}
      }

      pcsRef.current.forEach((pc) => pc.close());
      pcsRef.current.clear();
      connectedPeersRef.current.clear();
      peerReadyRef.current.clear();
      iceQueueRef.current.clear();

      socketRef.current.emit("join", {
        room: target,
        role: "speaker",
        id: meId ?? undefined,
        src,
      } as MemberMeta);
      joinedSubRoomRef.current = target;

      setTimeout(() => dialEligibleReceivers(), 250);

      if (!dialTimerRef.current) {
        dialTimerRef.current = window.setInterval(() => {
          if (connectedPeersRef.current.size > 0) {
            clearInterval(dialTimerRef.current!);
            dialTimerRef.current = null;
            return;
          }
          dialEligibleReceivers();
        }, 1200);
      }
    },
    [dialEligibleReceivers, meId, roomCode]
  );

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const d = await RoomService.getRoomDetails(roomCode);
        if (!alive) return;
        setDetails(d);

        const chosen = chooseBestSourceLanguage(d);
        setAutoSrc(chosen);

        const socket = createSignalingClient(signalingURL, {
          path: signalingPath,
          withCredentials: false,
          transports: ["websocket", "polling"],
        });
        socketRef.current = socket;

        socket.on("room-info", (payload: RoomInfoPayload) => {
          if (!alive) return;
          const list = Array.isArray(payload?.members) ? payload.members! : [];
          membersRef.current = list;
          dialEligibleReceivers();
        });

        socket.on("answer", async ({ from, sdp, type }) => {
          const pc = pcsRef.current.get(from);
          if (!pc) return;
          await pc.setRemoteDescription({ sdp, type });
          peerReadyRef.current.add(from);

          const q = iceQueueRef.current.get(from) ?? [];
          for (const cand of q) {
            socketRef.current?.emit("ice-candidate", {
              room: joinedSubRoomRef.current || roomCode,
              to: from,
              candidate: cand,
            });
          }
          iceQueueRef.current.delete(from);
        });

        socket.on("ice-candidate", async ({ from, candidate }) => {
          const pc = pcsRef.current.get(from);
          if (!pc || !candidate) return;
          try {
            await pc.addIceCandidate(candidate);
          } catch {}
        });

        socket.on("bye", ({ from }) => {
          const pc = pcsRef.current.get(from);
          if (pc) {
            try {
              pc.close();
            } catch {}
            pcsRef.current.delete(from);
            connectedPeersRef.current.delete(from);
            peerReadyRef.current.delete(from);
            iceQueueRef.current.delete(from);
          }
        });

        if (chosen) {
          joinSubRoom(chosen);
        } else {
          socket.emit("join", {
            room: roomCode,
            role: "speaker",
            id: meId ?? undefined,
          } as MemberMeta);
        }
      } catch {}
    })();

    return () => {
      alive = false;

      try {
        if (joinedSubRoomRef.current)
          socketRef.current?.emit("leave", { room: joinedSubRoomRef.current });
        else socketRef.current?.emit("leave", { room: roomCode });
      } catch {}

      socketRef.current?.disconnect();
      socketRef.current = null;

      if (dialTimerRef.current) {
        clearInterval(dialTimerRef.current);
        dialTimerRef.current = null;
      }

      pcsRef.current.forEach((pc) => pc.close());
      pcsRef.current.clear();
      connectedPeersRef.current.clear();
      peerReadyRef.current.clear();
      iceQueueRef.current.clear();

      try {
        meterStopRef.current?.();
      } catch {}
      meterStopRef.current = null;

      const mic = micStreamRef.current;
      if (mic) mic.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    };
  }, [
    joinSubRoom,
    roomCode,
    meId,
    signalingURL,
    signalingPath,
    dialEligibleReceivers,
  ]);

  return { details, micLevel, autoSrc, joinSubRoom };
}
