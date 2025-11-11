"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Button, Paper, Typography } from "@mui/material";
import MicLevelMeter from "@/components/room/MicLevelMeter";

const iceServers: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: [`stun:${env.TurnUrl()}`] },
  {
    urls: [
      `turn:${env.TurnUrl()}?transport=tcp`,
      `turn:${env.TurnUrl()}?transport=udp`,
    ],
    username: env.TurnUser(),
    credential: env.TurnPassword(),
  },
];

type PeerKey = string | number;

export default function RelayPage({ params }: { params: { room: string } }) {
  const roomCode = params.room;
  const meId = LocalStorage.userId.get() ?? null;

  const socketRef = useRef<Socket | null>(null);

  const joinedSrcRoomRef = useRef<string>("");
  const joinedTgtRoomRef = useRef<string>("");

  const upstreamPcRef = useRef<RTCPeerConnection | null>(null);
  const upstreamPeerIdRef = useRef<PeerKey | null>(null);

  const dsPcsRef = useRef<Map<PeerKey, RTCPeerConnection>>(new Map());
  const dsConnectedRef = useRef<Set<PeerKey>>(new Set());
  const dsIceQueueRef = useRef<Map<PeerKey, RTCIceCandidateInit[]>>(new Map());
  const dsPeerReadyRef = useRef<Set<PeerKey>>(new Set());

  const micStreamRef = useRef<MediaStream | null>(null);
  const micTrackRef = useRef<MediaStreamTrack | null>(null);

  const monitorAudioRef = useRef<HTMLAudioElement | null>(null);
  const monitorStreamRef = useRef<MediaStream | null>(null);
  const [monitorEnabled, setMonitorEnabled] = useState(false);
  const [rxLevel, setRxLevel] = useState(0);
  const rxMeterRAF = useRef<number | null>(null);

  const dsCtxRef = useRef<AudioContext | null>(null);
  const dsMetersRef = useRef<
    Map<
      PeerKey,
      {
        source: MediaStreamAudioSourceNode;
        analyser: AnalyserNode;
        data: Uint8Array;
        raf: number | null;
      }
    >
  >(new Map());
  const [dsLevels, setDsLevels] = useState<Record<string, number>>({});

  const [details, setDetails] = useState<RoomDetails | null>(null);
  const [autoSrc, setAutoSrc] = useState<string>("");
  const [autoTgt, setAutoTgt] = useState<string>("");

  const membersRef = useRef<MemberMeta[]>([]);
  const dialTimerRef = useRef<number | null>(null);

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

  const computeAutoTgt = useCallback((d: RoomDetails | null, src: string) => {
    if (!d) return "";
    const counts = new Map<string, number>();
    (d.translators ?? []).forEach((t) =>
      (t.pairs ?? []).forEach((p) => {
        const s = p?.source?.code;
        const tcode = p?.target?.code;
        if (s === src && tcode) {
          counts.set(tcode, (counts.get(tcode) ?? 0) + 1);
        }
      })
    );
    let best = "";
    let bestScore = -1;
    counts.forEach((v, k) => {
      if (v > bestScore) {
        best = k;
        bestScore = v;
      }
    });
    if (!best) {
      for (const t of d.translators ?? []) {
        for (const p of t.pairs ?? []) {
          if (p?.target?.code) return p.target.code;
        }
      }
    }
    return best;
  }, []);

  const joinLangRooms = useCallback(
    (src: string, tgt: string) => {
      if (!socketRef.current) return;

      if (joinedSrcRoomRef.current) {
        try {
          socketRef.current.emit("leave", { room: joinedSrcRoomRef.current });
        } catch {}
      }
      if (joinedTgtRoomRef.current) {
        try {
          socketRef.current.emit("leave", { room: joinedTgtRoomRef.current });
        } catch {}
      }

      dsPcsRef.current.forEach((pc) => pc.close());
      dsPcsRef.current.clear();
      dsConnectedRef.current.clear();
      dsPeerReadyRef.current.clear();
      dsIceQueueRef.current.clear();

      dsMetersRef.current.forEach((m, key) => {
        if (m.raf) cancelAnimationFrame(m.raf);
        try {
          m.source.disconnect();
          m.analyser.disconnect();
        } catch {}
        dsMetersRef.current.delete(key);
      });
      setDsLevels({});

      try {
        upstreamPcRef.current?.close?.();
      } catch {}
      upstreamPcRef.current = null;
      upstreamPeerIdRef.current = null;

      stopMonitor();

      const srcRoom = src ? `${roomCode}::${src}` : roomCode;
      socketRef.current.emit("join", {
        room: srcRoom,
        role: "relay",
        id: meId ?? undefined,
        src,
      } as MemberMeta);
      joinedSrcRoomRef.current = srcRoom;

      const tgtRoom = tgt ? `${roomCode}::${tgt}` : roomCode;
      socketRef.current.emit("join", {
        room: tgtRoom,
        role: "relay",
        id: meId ?? undefined,
        tgt,
      } as MemberMeta);
      joinedTgtRoomRef.current = tgtRoom;
    },
    [meId, roomCode]
  );

  const ensureMic = useCallback(async () => {
    if (micStreamRef.current && micTrackRef.current)
      return micStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      } as MediaTrackConstraints,
      video: false,
    });
    micStreamRef.current = stream;
    micTrackRef.current = stream.getAudioTracks()[0] ?? null;
    return stream;
  }, []);

  function startMonitor(stream: MediaStream) {
    monitorStreamRef.current = stream;
    const el = monitorAudioRef.current;
    if (el) {
      el.srcObject = stream;
      if (monitorEnabled) {
        el.play().catch(() => {});
      }
    }
    try {
      const Ctx =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      const srcNode = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      srcNode.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const level = Math.sqrt(sum / data.length);
        setRxLevel(level);
        rxMeterRAF.current = requestAnimationFrame(loop);
      };
      rxMeterRAF.current = requestAnimationFrame(loop);
    } catch {}
  }
  function stopMonitor() {
    if (rxMeterRAF.current) cancelAnimationFrame(rxMeterRAF.current);
    rxMeterRAF.current = null;
    setRxLevel(0);
    try {
      if (monitorAudioRef.current) {
        monitorAudioRef.current.pause();
        (monitorAudioRef.current as any).srcObject = null;
      }
    } catch {}
    const s = monitorStreamRef.current;
    if (s) s.getTracks().forEach((t) => t.stop());
    monitorStreamRef.current = null;
  }
  function toggleMonitor() {
    const next = !monitorEnabled;
    setMonitorEnabled(next);
    const el = monitorAudioRef.current;
    if (!el) return;
    if (next) el.play().catch(() => {});
    else el.pause();
  }

  function startDownstreamMeter(peerKey: PeerKey, stream: MediaStream) {
    try {
      const Ctx =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!dsCtxRef.current) dsCtxRef.current = new Ctx();
      const ctx = dsCtxRef.current!;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const loop = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const level = Math.sqrt(sum / data.length);
        setDsLevels((prev) => ({ ...prev, [String(peerKey)]: level }));
        const entry = dsMetersRef.current.get(peerKey);
        if (entry) entry.raf = requestAnimationFrame(loop);
      };

      dsMetersRef.current.set(peerKey, {
        source,
        analyser,
        data,
        raf: requestAnimationFrame(loop),
      });
    } catch {}
  }
  function stopDownstreamMeter(peerKey: PeerKey) {
    const m = dsMetersRef.current.get(peerKey);
    if (!m) return;
    if (m.raf) cancelAnimationFrame(m.raf);
    try {
      m.source.disconnect();
      m.analyser.disconnect();
    } catch {}
    dsMetersRef.current.delete(peerKey);
    setDsLevels((prev) => {
      const copy = { ...prev };
      delete copy[String(peerKey)];
      return copy;
    });
  }

  const ensureUpstreamPc = useCallback(() => {
    if (upstreamPcRef.current) return upstreamPcRef.current;
    const pc = new RTCPeerConnection({ iceServers });
    upstreamPcRef.current = pc;

    try {
      pc.addTransceiver?.("audio", { direction: "recvonly" });
    } catch {}

    pc.onicecandidate = (evt) => {
      if (!evt.candidate || upstreamPeerIdRef.current == null) return;
      const cand = evt.candidate.toJSON?.() ?? evt.candidate;
      socketRef.current?.emit("ice-candidate", {
        room: joinedSrcRoomRef.current || roomCode,
        to: upstreamPeerIdRef.current,
        candidate: cand,
      });
    };

    pc.ontrack = (ev) => {
      const track = ev.track;
      if (!track) return;
      const remoteStream = new MediaStream([track]);
      startMonitor(remoteStream);
    };

    pc.onconnectionstatechange = () => {
      const st = pc.connectionState;
      if (st === "failed" || st === "disconnected" || st === "closed") {
        try {
          pc.close();
        } catch {}
        upstreamPcRef.current = null;
        upstreamPeerIdRef.current = null;
        stopMonitor();
      }
    };

    return pc;
  }, [roomCode]);

  const getOrCreateDownstreamPc = useCallback(
    (peerKey: PeerKey) => {
      let pc = dsPcsRef.current.get(peerKey);
      if (pc) return pc;

      pc = new RTCPeerConnection({ iceServers });
      dsPcsRef.current.set(peerKey, pc);

      pc.onicecandidate = (evt) => {
        if (!evt.candidate) return;
        const cand = evt.candidate.toJSON?.() ?? evt.candidate;
        if (!dsPeerReadyRef.current.has(peerKey)) {
          const q = dsIceQueueRef.current.get(peerKey) ?? [];
          q.push(cand);
          dsIceQueueRef.current.set(peerKey, q);
          return;
        }
        socketRef.current?.emit("ice-candidate", {
          room: joinedTgtRoomRef.current || roomCode,
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
          dsPcsRef.current.delete(peerKey);
          dsConnectedRef.current.delete(peerKey);
          dsPeerReadyRef.current.delete(peerKey);
          dsIceQueueRef.current.delete(peerKey);
          stopDownstreamMeter(peerKey);
        }
        if (st === "connected") dsConnectedRef.current.add(peerKey);
      };

      return pc;
    },
    [roomCode]
  );

  const callUser = useCallback(
    async (target: MemberMeta) => {
      if (!joinedTgtRoomRef.current) return;

      const peerKey: PeerKey = (target.sid as any) ?? target.id;
      if (dsConnectedRef.current.has(peerKey)) return;

      try {
        const mic = await ensureMic();
        const micTrack = mic.getAudioTracks()[0];
        if (!micTrack) return;

        const pc = getOrCreateDownstreamPc(peerKey);

        const existing = pc
          .getSenders()
          .find((s) => s.track && s.track.kind === "audio");
        if (existing) {
          await existing.replaceTrack(micTrack);
        } else {
          const outStream = new MediaStream([micTrack]);
          pc.addTrack(micTrack, outStream);
          startDownstreamMeter(peerKey, outStream);
        }

        const offer = await pc.createOffer({ offerToReceiveAudio: false });
        await pc.setLocalDescription(offer);

        socketRef.current?.emit("offer", {
          room: joinedTgtRoomRef.current,
          to: peerKey,
          sdp: offer.sdp,
          type: offer.type,
          meta: {
            tgt: autoTgt,
            from_role: "relay",
            me: { id: meId },
          },
        });
      } catch {}
    },
    [autoTgt, ensureMic, getOrCreateDownstreamPc, meId]
  );

  const dialEligibleUsers = useCallback(() => {
    const users = (membersRef.current || []).filter((m) => m.role === "user");
    users.forEach((m) => callUser(m));
  }, [callUser]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const d = (await RoomService.GetRoom(roomCode)).Data as RoomDetails;
        if (!alive) return;
        setDetails(d);

        const chosenSrc = computeAutoSrc(d);
        setAutoSrc(chosenSrc);

        const chosenTgt = computeAutoTgt(d, chosenSrc);
        setAutoTgt(chosenTgt);

        const socket = io(env.BackendUrl(), {
          transports: ["websocket", "polling"],
          path: "/signal",
          withCredentials: false,
        });
        socketRef.current = socket;

        socket.on("room-info", (payload: RoomInfoPayload) => {
          if (!alive) return;
          const list = Array.isArray(payload?.members) ? payload!.members! : [];
          membersRef.current = list;
          dialEligibleUsers();
        });

        socket.on("offer", async ({ from, sdp, meta }) => {
          if (!alive) return;
          try {
            if (!from || !sdp) return;
            const fromRole =
              meta?.from_role ?? meta?.role ?? meta?.senderRole ?? "";
            const src = meta?.src ?? meta?.source ?? "";
            if (fromRole !== "speaker") return;
            if (autoSrc && src && src !== autoSrc) return;

            upstreamPeerIdRef.current = from;
            const pc = ensureUpstreamPc();

            if (pc.signalingState === "have-local-offer") {
              try {
                await pc.setLocalDescription({ type: "rollback" } as any);
              } catch {}
            }
            if (pc.signalingState !== "have-remote-offer") {
              await pc.setRemoteDescription({ type: "offer", sdp } as any);
            }
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit("answer", {
              room: joinedSrcRoomRef.current || roomCode,
              to: from,
              sdp: pc.localDescription?.sdp || "",
              type: pc.localDescription?.type || "answer",
              meta: { from_role: "relay", me: { id: meId }, src: autoSrc },
            });
          } catch {}
        });

        socket.on("answer", async ({ from, sdp, type }) => {
          const pc = dsPcsRef.current.get(from);
          if (!pc) return;
          try {
            await pc.setRemoteDescription({ sdp, type });
            dsPeerReadyRef.current.add(from);
            const q = dsIceQueueRef.current.get(from) ?? [];
            for (const cand of q) {
              socketRef.current?.emit("ice-candidate", {
                room: joinedTgtRoomRef.current || roomCode,
                to: from,
                candidate: cand,
              });
            }
            dsIceQueueRef.current.delete(from);
          } catch {}
        });

        socket.on("ice-candidate", async ({ from, candidate }) => {
          if (!candidate) return;
          if (from != null && from === upstreamPeerIdRef.current) {
            const pc = upstreamPcRef.current;
            if (!pc) return;
            try {
              await pc.addIceCandidate(candidate);
            } catch {}
            return;
          }
          const dpc = dsPcsRef.current.get(from);
          if (!dpc) return;
          try {
            await dpc.addIceCandidate(candidate);
          } catch {}
        });

        socket.on("bye", ({ from }) => {
          if (from != null && from === upstreamPeerIdRef.current) {
            try {
              upstreamPcRef.current?.close?.();
            } catch {}
            upstreamPcRef.current = null;
            upstreamPeerIdRef.current = null;
            stopMonitor();
            return;
          }
          const dpc = dsPcsRef.current.get(from);
          if (dpc) {
            try {
              dpc.close();
            } catch {}
            dsPcsRef.current.delete(from);
            dsConnectedRef.current.delete(from);
            dsPeerReadyRef.current.delete(from);
            dsIceQueueRef.current.delete(from);
            stopDownstreamMeter(from);
          }
        });

        joinLangRooms(chosenSrc, chosenTgt);
      } catch {}
    })();

    return () => {
      alive = false;

      try {
        if (joinedSrcRoomRef.current)
          socketRef.current?.emit("leave", { room: joinedSrcRoomRef.current });
        if (joinedTgtRoomRef.current)
          socketRef.current?.emit("leave", { room: joinedTgtRoomRef.current });
        else socketRef.current?.emit("leave", { room: roomCode });
      } catch {}

      socketRef.current?.disconnect();
      socketRef.current = null;

      if (dialTimerRef.current) {
        clearInterval(dialTimerRef.current);
        dialTimerRef.current = null;
      }

      try {
        upstreamPcRef.current?.close?.();
      } catch {}
      upstreamPcRef.current = null;
      upstreamPeerIdRef.current = null;

      dsPcsRef.current.forEach((pc, key) => {
        try {
          pc.close();
        } catch {}
        stopDownstreamMeter(key);
      });
      dsPcsRef.current.clear();
      dsConnectedRef.current.clear();
      dsPeerReadyRef.current.clear();
      dsIceQueueRef.current.clear();

      stopMonitor();

      try {
        dsCtxRef.current?.close();
      } catch {}
      dsCtxRef.current = null;

      const mic = micStreamRef.current;
      if (mic) mic.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
      micTrackRef.current = null;
    };
  }, [
    computeAutoSrc,
    computeAutoTgt,
    joinLangRooms,
    ensureUpstreamPc,
    roomCode,
    meId,
    autoSrc,
  ]);

  const micLevel = useMemo(
    () =>
      Object.values(dsLevels).length ? Math.max(...Object.values(dsLevels)) : 0,
    [dsLevels]
  );

  const userPeers = (membersRef.current || []).filter((m) => m.role === "user");

  return (
    <Screen>
      <Box.Column style={{ gap: 16 }}>
        <Typography variant="h2">Sala: {details?.name ?? roomCode}</Typography>

        <Paper
          style={{
            padding: 12,
            display: "flex",
            gap: 12,
            flexDirection: "column",
          }}>
          <MicLevelMeter micLevel={rxLevel} label={"Entrada"} showDb={false} />
          <Button size="small" variant="outlined" onClick={toggleMonitor}>
            {monitorEnabled ? "Mutar palestrante" : "Ouvir palestrante"}
          </Button>
          <audio ref={monitorAudioRef} autoPlay playsInline />
        </Paper>

        <Paper style={{ padding: 12 }}>
          <MicLevelMeter micLevel={micLevel} label={"Saída"} showDb={false} />
        </Paper>
      </Box.Column>
    </Screen>
  );
}
