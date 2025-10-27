"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Screen from "@/components/base/Screen";
import Box from "@/components/base/Box";
import io, { Socket } from "socket.io-client";
import env from "@/config/env";
import RoomService from "@/services/api/roomService";
import { LocalStorage } from "@/storage/LocalStorage";
import {
  RoomDetails,
  Translator,
  MemberMeta,
  RoomInfoPayload,
} from "@/types/room";
import { Paper, Typography } from "@mui/material";

const iceServers: RTCIceServer[] = [];

type PeerKey = string | number;

export default function SpeakerPage({ params }: { params: { room: string } }) {
  const roomCode = params.room;
  const meId = LocalStorage.userId.get() ?? null;

  const socketRef = useRef<Socket | null>(null);

  const pcsRef = useRef<Map<PeerKey, RTCPeerConnection>>(new Map());
  const connectedPeersRef = useRef<Set<PeerKey>>(new Set());
  const iceQueueRef = useRef<Map<PeerKey, RTCIceCandidateInit[]>>(new Map());
  const peerReadyRef = useRef<Set<PeerKey>>(new Set());

  const micStreamRef = useRef<MediaStream | null>(null);

  const [details, setDetails] = useState<RoomDetails | null>(null);
  const [autoSrc, setAutoSrc] = useState<string>("");
  const [micLevel, setMicLevel] = useState(0);

  const membersRef = useRef<MemberMeta[]>([]);
  const joinedSubRoomRef = useRef<string>("");
  const dialTimerRef = useRef<number | null>(null);

  const startMicMeter = useCallback((stream: MediaStream) => {
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const level = Math.sqrt(sum / data.length);
        setMicLevel(level);
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    } catch {}
  }, []);

  const ensureMic = useCallback(async () => {
    if (micStreamRef.current) return micStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    micStreamRef.current = stream;
    startMicMeter(stream);
    return stream;
  }, [startMicMeter]);

  const getPeerKey = (m: Pick<MemberMeta, "id" | "sid">) => m.sid ?? m.id;

  const getOrCreatePC = useCallback(
    (peerKey: PeerKey) => {
      let pc = pcsRef.current.get(peerKey);
      if (pc) return pc;

      pc = new RTCPeerConnection({ iceServers });
      pcsRef.current.set(peerKey, pc);

      pc.onicecandidate = (evt) => {
        if (!evt.candidate) return;
        const cand = evt.candidate.toJSON?.() ?? evt.candidate;
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
        const st = pc.connectionState;
        if (st === "failed" || st === "disconnected" || st === "closed") {
          try {
            pc.close();
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
    [roomCode]
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
            me: { id: meId },
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
      (m) => m.role === "user" && (m.tgt === autoSrc || (!m.tgt && autoSrc))
    );

    const targets = [...relays, ...usersOriginal];
    targets.forEach((m) => {
      const key = getPeerKey(m);
      if (!connectedPeersRef.current.has(key)) callReceiver(m);
    });
  }, [callReceiver, autoSrc]);

  const computeAutoSrc = useCallback((d: RoomDetails | null) => {
    if (!d) return "";
    const speakerCodes = new Set(
      (d.speakers ?? []).flatMap((s) =>
        (s.languages ?? []).map((l) => l.code).filter(Boolean)
      ) as string[]
    );
    const unique = Array.from(speakerCodes);
    if (unique.length === 1) return unique[0]!;

    const cov = new Map<string, number>();
    const translators = (d.translators ?? []) as Translator[];
    for (const t of translators) {
      for (const p of t.pairs ?? []) {
        const c = p?.source?.code;
        if (!c) continue;
        cov.set(c, (cov.get(c) ?? 0) + 1);
      }
    }

    let best = "";
    let bestScore = -1;
    for (const code of unique) {
      const score = cov.get(code) ?? 0;
      if (score > bestScore) {
        best = code;
        bestScore = score;
      }
    }
    if (!best && cov.size) {
      cov.forEach((score, code) => {
        if (score > bestScore) {
          best = code;
          bestScore = score;
        }
      });
    }
    return best;
  }, []);

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
        const d = (await RoomService.GetRoom(roomCode)).Data as RoomDetails;
        if (!alive) return;
        setDetails(d);

        const chosen = computeAutoSrc(d);
        setAutoSrc(chosen);

        const socket = io(env.BackendUrl(), {
          transports: ["websocket", "polling"],
          path: "/signal",
          withCredentials: false,
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

      const mic = micStreamRef.current;
      if (mic) mic.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    };
  }, [computeAutoSrc, dialEligibleReceivers, joinSubRoom, roomCode, meId]);

  return (
    <Screen>
      <Box.Column style={{ gap: 16 }}>
        <Typography variant="h2">Sala: {details?.name ?? roomCode}</Typography>
        <Paper
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
            padding: 12,
          }}>
          <Typography variant="body2">
            Volume de saida: <strong>{micLevel.toFixed(3)}</strong>
          </Typography>
        </Paper>
      </Box.Column>
    </Screen>
  );
}
