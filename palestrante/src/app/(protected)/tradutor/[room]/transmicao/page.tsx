"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Screen from "@/components/base/Screen";
import Box from "@/components/base/Box";
import io, { Socket } from "socket.io-client";
import env from "@/config/env";
import RoomService from "@/services/api/roomService";
import { LocalStorage } from "@/storage/LocalStorage";
import { RoomDetails, LangPair, MemberMeta, OfferPayload } from "@/types/room";
import { Paper, Typography } from "@mui/material";

const iceServers: RTCIceServer[] = [];

export default function TranslatorPage({
  params,
}: {
  params: { room: string };
}) {
  const roomCode = params.room;
  const meId = LocalStorage.userId.get();

  const socketRef = useRef<Socket | null>(null);

  const pcsRef = useRef<Map<string | number, RTCPeerConnection>>(new Map());
  const peerRoomRef = useRef<Map<string | number, string>>(new Map());
  const joinedRoomsRef = useRef<Set<string>>(new Set());

  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const meterStartedRef = useRef(false);

  const [details, setDetails] = useState<RoomDetails | null>(null);
  const [rxLevel, setRxLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const subRoomOf = useCallback(
    (src: string) => (src ? `${roomCode}::${src}` : roomCode),
    [roomCode]
  );

  const startMeter = useCallback((stream: MediaStream) => {
    if (meterStartedRef.current) return;
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const ctx = audioCtxRef.current!;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      src.connect(analyser);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        setRxLevel(Math.sqrt(sum / data.length));
        rafRef.current = requestAnimationFrame(tick);
      };
      meterStartedRef.current = true;
      rafRef.current = requestAnimationFrame(tick);
    } catch {}
  }, []);

  const stopMeter = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    meterStartedRef.current = false;
    setRxLevel(0);
    try {
      analyserRef.current?.disconnect();
    } catch {}
    analyserRef.current = null;
  }, []);

  const getOrCreatePC = useCallback(
    (peerId: string | number) => {
      let pc = pcsRef.current.get(peerId);
      if (pc) return pc;

      pc = new RTCPeerConnection({ iceServers });
      pcsRef.current.set(peerId, pc);

      try {
        if (pc.getTransceivers().length === 0) {
          pc.addTransceiver("audio", { direction: "recvonly" });
        }
      } catch {}

      pc.onicecandidate = (evt) => {
        if (!evt.candidate) return;
        const room = peerRoomRef.current.get(peerId) || roomCode;
        socketRef.current?.emit("ice-candidate", {
          room,
          to: peerId,
          candidate: evt.candidate.toJSON(),
        });
      };

      pc.ontrack = (evt) => {
        const track = evt.track;
        const stream =
          (evt.streams && evt.streams[0]) || new MediaStream([track]);
        attachStream(stream);
        startMeter(stream);
      };

      pc.onconnectionstatechange = () => {
        const st = pc.connectionState;
        if (st === "failed" || st === "closed") {
          pcsRef.current.delete(peerId);
          peerRoomRef.current.delete(peerId);
        }
      };

      return pc;
    },
    [roomCode, startMeter]
  );

  const applyRemoteOfferAndAnswer = useCallback(
    async (pc: RTCPeerConnection, sdp: string) => {
      if (pc.signalingState === "have-local-offer") {
        try {
          await pc.setLocalDescription({ type: "rollback" } as any);
        } catch {}
      }
      if (pc.signalingState !== "have-remote-offer") {
        await pc.setRemoteDescription({ type: "offer", sdp });
      }
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      return answer;
    },
    []
  );

  const attachStream = useCallback((stream: MediaStream) => {
    const el = remoteAudioRef.current;
    if (!el) return;

    const cur = (el as any).srcObject as MediaStream | null;
    if (cur !== stream) {
      (el as any).srcObject = stream;
      el.load?.();
    }

    el.muted = false;
    el.volume = 1.0;
    el.play().catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setError(null);

        const d = (await RoomService.GetRoom(roomCode)).Data as RoomDetails;
        if (!alive) return;
        setDetails(d);

        const me = (d.translators ?? []).find(
          (t: any) =>
            String(t.id) === String(meId) || String(t.user_id) === String(meId)
        );

        const roomSources = Array.from(
          new Set(
            [
              ...(d.translators ?? []).flatMap((t: any) =>
                (t.pairs ?? []).map((p: any) => p?.source?.code)
              ),
              ...(d.speakers ?? []).flatMap((s: any) =>
                (s.languages ?? []).map((l: any) => l?.code)
              ),
            ].filter(Boolean)
          )
        );

        const sources: string[] = Array.from(
          new Set(
            ((me?.pairs ?? []) as LangPair[])
              .map((p) => p?.source?.code)
              .filter(Boolean) as string[]
          )
        );
        if (sources.length === 0 && roomSources.length > 0) {
          sources.push(...roomSources);
        }

        const socket = io(env.SignalingURL(), {
          transports: ["websocket", "polling"],
          path: "/signal",
          withCredentials: false,
        });
        socketRef.current = socket;

        socket.on("offer", async (payload: OfferPayload) => {
          try {
            const { from, sdp, meta } = payload || {};
            const src = meta?.src || "";
            const room = src ? subRoomOf(src) : roomCode;
            if (!sdp) return;

            const pc = getOrCreatePC(from);
            peerRoomRef.current.set(from, room);

            const answer = await applyRemoteOfferAndAnswer(pc, sdp);

            socket.emit("answer", {
              room,
              to: from,
              sdp: answer.sdp,
              type: answer.type,
              meta: { from_role: "translator", me: { id: meId } },
            });
          } catch {}
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
            peerRoomRef.current.delete(from);
          }
        });

        if (sources.length === 0) {
          socket.emit("join", {
            room: roomCode,
            role: "translator",
            id: meId,
          } as MemberMeta);
          joinedRoomsRef.current.add(roomCode);
        } else {
          for (const src of sources) {
            const room = subRoomOf(src);
            if (!joinedRoomsRef.current.has(room)) {
              socket.emit("join", {
                room,
                role: "translator",
                id: meId,
                src,
                pairs: (me?.pairs ?? []).map((p) => ({
                  source: { code: p?.source?.code },
                  target: { code: p?.target?.code },
                })),
              } as MemberMeta);
              joinedRoomsRef.current.add(room);
            }
          }
        }
      } catch (e: any) {
        if (alive) setError(e?.message ?? "Falha ao conectar.");
      }
    })();

    return () => {
      alive = false;

      try {
        const rooms = Array.from(joinedRoomsRef.current.values());
        for (const r of rooms) socketRef.current?.emit("leave", { room: r });
      } catch {}

      socketRef.current?.disconnect();
      socketRef.current = null;

      pcsRef.current.forEach((pc) => {
        try {
          pc.close();
        } catch {}
      });
      pcsRef.current.clear();
      peerRoomRef.current.clear();

      stopMeter();
      try {
        audioCtxRef.current?.close();
      } catch {}
      audioCtxRef.current = null;

      joinedRoomsRef.current.clear();
    };
  }, [
    roomCode,
    meId,
    getOrCreatePC,
    stopMeter,
    subRoomOf,
    applyRemoteOfferAndAnswer,
  ]);

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
          }}>
          <Typography variant="body1">
            Volume: <strong>{rxLevel.toFixed(3)}</strong>
          </Typography>
        </Paper>
        <audio ref={remoteAudioRef} autoPlay playsInline />
      </Box.Column>
    </Screen>
  );
}
