import env from "@/config/env";
import RoomService from "@/services/api/RoomService";
import { setAudioModeAsync } from "expo-audio";
import InCallManager from "react-native-incall-manager";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { io, Socket } from "socket.io-client";

type WebRTCModule = typeof import("react-native-webrtc");

type Language = { code: string; name: string };
type Speaker = {
  name: string;
  bio?: string | null;
  user_id: number | string;
  languages: Language[];
};
type Pair = { source: Language; target: Language };
type Translator = { name: string; user_id: number | string; pairs: Pair[] };

type RoomDetails = {
  id: number | string;
  code: string;
  name: string;
  description?: string | null;
  speakers: Speaker[];
  translators: Translator[];
};

type LanguageOption = { code: string; name: string; label: string };
const iceServers: { urls: string; username?: string; credential?: string }[] = [
  { urls: "stun:stun.l.google.com:19302" },
];

const BLUE = "#0B66C3";
const GREEN = "#059669";
const GRAY = "#9CA3AF";

type OfferPayload = {
  from: string | number;
  sdp: string;
  type?: "offer";
  meta?: any;
};
type AnswerPayload = {
  to: string | number;
  sdp: string;
  type?: "answer";
  room: string;
  meta?: any;
};
type IcePayload = {
  from?: string | number;
  to?: string | number;
  candidate: any;
  room: string;
  meta?: any;
};
type MemberMeta = {
  id: string | number;
  sid?: string;
  role?: "translator" | "speaker" | "admin" | "user";
  src?: string;
  tgt?: string;
  pairs?: { source?: { code?: string }; target?: { code?: string } }[];
};
type RxStats = {
  level: number;
  kbps: number;
  pps: number;
  isReceiving: boolean;
  lastAt: number;
  rtt_ms?: number;
  jitter_ms?: number;
};
type AnyRTCPeerConnection = any;

function uuid4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const configureAudioSession = async () => {
  try {
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionModeAndroid: "duckOthers",
      interruptionMode: "mixWithOthers",
      shouldRouteThroughEarpiece: true,
    });
  } catch (e) {
    console.warn("Erro ao configurar áudio:", e);
  }
};

export default function ListenScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { code, lang } = useLocalSearchParams<{
    code?: string;
    lang?: string;
  }>();
  const roomCode = useMemo(() => String(code ?? "").trim(), [code]);

  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  const webrtcRef = useRef<WebRTCModule | null>(null);

  const [audioLang, setAudioLang] = useState<LanguageOption | null>(null);
  const [captionLang, setCaptionLang] = useState<LanguageOption | null>(null);

  const audioLangRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    audioLangRef.current = audioLang?.code;
  }, [audioLang?.code]);

  const socketRef = useRef<Socket | null>(null);
  const pcsRef = useRef<Map<string | number, AnyRTCPeerConnection>>(new Map());
  const peerRoomRef = useRef<Map<string | number, string>>(new Map());
  const joinedRoomsRef = useRef<Set<string>>(new Set());
  const meIdRef = useRef<string>(uuid4());

  const [rx, setRx] = useState<RxStats>({
    level: 0,
    kbps: 0,
    pps: 0,
    isReceiving: false,
    lastAt: 0,
    rtt_ms: undefined,
    jitter_ms: undefined,
  });
  const statsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [tempLang, setTempLang] = useState<LanguageOption | null>(null);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  const safePadBottom = Math.max(16, insets.bottom + 16);

  useEffect(() => {
    configureAudioSession();
    const interval = setInterval(() => {}, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchRoom = useCallback(async () => {
    if (!roomCode) {
      setRoom(null);
      setError("Código ausente.");
      return;
    }
    setError(null);
    try {
      const res = await RoomService.GetByCode(roomCode);
      const data = (res?.Data ?? res) as RoomDetails | null;
      if (!data || !data.code) {
        setRoom(null);
        setError("Sessão não encontrada para este código.");
      } else {
        setRoom(data);
      }
    } catch (e: any) {
      setRoom(null);
      setError(e?.message ?? "Falha ao carregar os dados da sessão.");
    }
  }, [roomCode]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const mod = await import("react-native-webrtc");
        if (!alive) return;
        webrtcRef.current = mod;
      } catch {
        setError(
          "Módulo nativo WebRTC não encontrado. Rode com um Dev Client."
        );
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const languageOptions = useMemo<LanguageOption[]>(() => {
    const map = new Map<string, LanguageOption>();
    room?.speakers?.forEach((sp) => {
      sp.languages?.forEach((l) => {
        if (!l?.code) return;
        const label = `${l.name} (Original)`;
        const prev = map.get(l.code);
        if (!prev) map.set(l.code, { code: l.code, name: l.name, label });
        else if (!prev.label.includes("(Original)"))
          map.set(l.code, { ...prev, label });
      });
    });
    room?.translators?.forEach((tr) =>
      tr.pairs?.forEach((p) => {
        const t = p?.target;
        if (t?.code && !map.has(t.code)) {
          map.set(t.code, { code: t.code, name: t.name, label: t.name });
        }
      })
    );
    return Array.from(map.values());
  }, [room]);

  useEffect(() => {
    if (languageOptions.length) {
      const byParam = lang
        ? languageOptions.find((o) => o.code === lang)
        : null;
      setAudioLang((s) => s ?? byParam ?? languageOptions[0]);
      if (!captionLang) {
        const firstDiff = languageOptions.find(
          (o) => o.code !== (byParam?.code ?? languageOptions[0].code)
        );
        setCaptionLang(firstDiff ?? languageOptions[0]);
      }
    }
  }, [languageOptions, lang, captionLang]);

  function openSheet() {
    setTempLang(audioLang);
    setSheetVisible(true);
    Animated.timing(sheetAnim, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }
  function closeSheet(apply = false) {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        if (apply && tempLang) {
          const old = audioLang?.code;
          setAudioLang(tempLang);
          if (tempLang.code !== old) retuneRooms(tempLang.code).catch(() => {});
        }
        setSheetVisible(false);
      }
    });
  }

  const overlayOpacity = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });
  const translateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  const stopRxMonitor = useCallback(() => {
    if (statsTimerRef.current) clearInterval(statsTimerRef.current);
    statsTimerRef.current = null;
    setRx((prev) => ({
      ...prev,
      level: 0,
      kbps: 0,
      pps: 0,
      isReceiving: false,
      rtt_ms: undefined,
      jitter_ms: undefined,
    }));
  }, []);

  const startRxMonitor = useCallback(
    (pc: AnyRTCPeerConnection) => {
      stopRxMonitor();
      let lastBytes = 0;
      let lastPkts = 0;
      let lastTs = 0;

      statsTimerRef.current = setInterval(async () => {
        try {
          const stats = await pc.getStats();
          let level = 0;
          let bytes = 0;
          let pkts = 0;
          let rttMs: number | undefined;
          let jitterMs: number | undefined;

          const ts = Date.now();

          stats.forEach((r: any) => {
            if (r.type === "inbound-rtp" && r.kind === "audio") {
              if (typeof r.audioLevel === "number") {
                level = Math.max(level, r.audioLevel);
              }
              if (typeof r.bytesReceived === "number") {
                bytes = r.bytesReceived;
              }
              if (typeof r.packetsReceived === "number") {
                pkts = r.packetsReceived;
              }
              if (typeof r.jitter === "number") {
                jitterMs = r.jitter * 1000;
              }
            }

            if (r.type === "candidate-pair" && r.state === "succeeded") {
              if (typeof r.currentRoundTripTime === "number") {
                rttMs = r.currentRoundTripTime * 1000;
              } else if (typeof r.roundTripTime === "number") {
                rttMs = r.roundTripTime * 1000;
              }
            }
          });

          const dt = lastTs ? (ts - lastTs) / 1000 : 0;
          const kbps =
            dt > 0 ? (Math.max(0, bytes - lastBytes) * 8) / dt / 1000 : 0;
          const pps = dt > 0 ? Math.max(0, pkts - lastPkts) / dt : 0;
          const receiving = level > 0.001 || kbps > 1 || pps > 0.5;

          setRx({
            level,
            kbps: Number(kbps.toFixed(1)),
            pps: Number(pps.toFixed(1)),
            isReceiving: receiving,
            lastAt: receiving ? ts : lastTs || 0,
            rtt_ms: rttMs,
            jitter_ms: jitterMs,
          });

          lastBytes = bytes;
          lastPkts = pkts;
          lastTs = ts;
        } catch {
          setRx((prev) => {
            const dec = Math.max(0, prev.level * 0.8 - 0.005);
            return {
              ...prev,
              level: dec,
              kbps: prev.kbps * 0.7,
              pps: prev.pps * 0.7,
            };
          });
        }
      }, 600);
    },
    [stopRxMonitor]
  );

  const getOrCreatePC = useCallback(
    (peerId: string | number) => {
      let pc = pcsRef.current.get(peerId);
      if (pc) return pc;
      if (!webrtcRef.current) throw new Error("WebRTC não carregado");
      const { RTCPeerConnection: PC } = webrtcRef.current;
      pc = new PC({ iceServers });
      pcsRef.current.set(peerId, pc);
      try {
        (pc as any).addTransceiver?.("audio", { direction: "recvonly" });
      } catch {}

      (pc as AnyRTCPeerConnection).onicecandidate = (evt: any) => {
        if (!evt.candidate) return;
        const room = peerRoomRef.current.get(peerId) || roomCode;
        const payload: IcePayload = {
          to: peerId,
          candidate: evt.candidate?.toJSON?.() ?? evt.candidate,
          room,
          meta: { from_role: "user", me: { id: meIdRef.current } },
        };
        socketRef.current?.emit("ice-candidate", payload);
      };

      (pc as AnyRTCPeerConnection).ontrack = async () => {
        await configureAudioSession();
        setTimeout(() => configureAudioSession(), 500);

        startRxMonitor(pc!);
      };

      (pc as AnyRTCPeerConnection).onconnectionstatechange = async () => {
        const st = (pc as AnyRTCPeerConnection)?.connectionState;
        if (st === "connected") {
          await configureAudioSession();
        }
        if (st === "failed" || st === "closed" || st === "disconnected") {
          pcsRef.current.delete(peerId);
          peerRoomRef.current.delete(peerId);
          stopRxMonitor();
        }
      };
      return pc;
    },
    [roomCode, startRxMonitor, stopRxMonitor]
  );

  const applyRemoteOfferAndAnswer = useCallback(
    async (pc: AnyRTCPeerConnection, sdp: string) => {
      if (!webrtcRef.current) throw new Error("WebRTC não carregado");
      const { RTCSessionDescription } = webrtcRef.current;
      if ((pc as AnyRTCPeerConnection).signalingState === "have-local-offer") {
        try {
          await (pc as AnyRTCPeerConnection).setLocalDescription({
            type: "rollback",
          } as any);
        } catch {}
      }
      if ((pc as AnyRTCPeerConnection).signalingState !== "have-remote-offer") {
        await (pc as AnyRTCPeerConnection).setRemoteDescription(
          new RTCSessionDescription({ type: "offer", sdp })
        );
      }
      const answer = await (pc as AnyRTCPeerConnection).createAnswer();
      await (pc as AnyRTCPeerConnection).setLocalDescription(answer);
      return answer;
    },
    []
  );

  const currentTargetRoom = useCallback(
    (tgtCode?: string) => (tgtCode ? `${roomCode}::${tgtCode}` : roomCode),
    [roomCode]
  );

  const joinRoomsForTarget = useCallback(
    async (tgtCode?: string) => {
      const socket = socketRef.current;
      if (!socket || !socket.connected) return;
      const main = roomCode;
      const tgtRoom = currentTargetRoom(tgtCode);
      const me = {
        room: tgtRoom,
        role: "user",
        id: meIdRef.current,
        tgt: tgtCode,
      } as MemberMeta;
      if (!joinedRoomsRef.current.has(main)) {
        socket.emit("join", {
          room: main,
          role: "user",
          id: meIdRef.current,
        } as MemberMeta);
        joinedRoomsRef.current.add(main);
      }
      if (!joinedRoomsRef.current.has(tgtRoom)) {
        socket.emit("join", me);
        joinedRoomsRef.current.add(tgtRoom);
      }
    },
    [roomCode, currentTargetRoom]
  );

  const retuneRooms = useCallback(
    async (newTgt: string) => {
      try {
        const socket = socketRef.current;
        if (socket) {
          const copy = Array.from(joinedRoomsRef.current.values());
          for (const r of copy) {
            if (r.startsWith(`${roomCode}::`)) {
              socket.emit("leave", { room: r });
              joinedRoomsRef.current.delete(r);
            }
          }
          await joinRoomsForTarget(newTgt);
        }
      } catch {}
      pcsRef.current.forEach((pc) => {
        try {
          (pc as AnyRTCPeerConnection).close();
        } catch {}
      });
      pcsRef.current.clear();
      peerRoomRef.current.clear();
      stopRxMonitor();
    },
    [joinRoomsForTarget, roomCode, stopRxMonitor]
  );

  useEffect(() => {
    InCallManager.start({ media: "audio", auto: true });
    InCallManager.setSpeakerphoneOn(false);
    const socket = io(env.ApiUrl(), {
      transports: ["websocket"],
      path: "/signal",
      withCredentials: false,
    });
    socketRef.current = socket;

    const initialJoinedRooms = Array.from(joinedRoomsRef.current.values());
    const pcs = pcsRef.current;
    const peerRooms = peerRoomRef.current;
    const joinedRooms = joinedRoomsRef.current;

    const onConnect = () => {
      joinRoomsForTarget(audioLangRef.current).catch(() => {});
    };

    const onOffer = async (payload: OfferPayload) => {
      try {
        const { from, sdp, meta } = payload || {};
        if (!sdp || !from) return;

        const senderRole =
          meta?.from_role ?? meta?.role ?? meta?.senderRole ?? "";

        const offerLang =
          senderRole === "speaker"
            ? meta?.src ?? meta?.source
            : meta?.tgt ?? meta?.target;

        if (
          audioLangRef.current &&
          offerLang &&
          offerLang !== audioLangRef.current
        ) {
          return;
        }

        const roomForThis = currentTargetRoom(offerLang);
        const pc = getOrCreatePC(from);
        peerRoomRef.current.set(from, roomForThis);

        const answer = await applyRemoteOfferAndAnswer(pc, sdp);

        const ansPayload: AnswerPayload = {
          room: roomForThis,
          to: from,
          sdp: (answer as any)?.sdp || "",
          type: (answer as any)?.type,
          meta: {
            from_role: "user",
            me: { id: meIdRef.current },
            tgt: audioLangRef.current,
          },
        };
        socketRef.current?.emit("answer", ansPayload);
      } catch {}
    };

    const onIce = async ({ from, candidate }: any) => {
      if (!webrtcRef.current) return;
      const { RTCIceCandidate } = webrtcRef.current;
      const pc = pcsRef.current.get(from);
      if (!pc || !candidate) return;
      try {
        await (pc as AnyRTCPeerConnection).addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch {}
    };

    const onBye = ({ from }: any) => {
      const pc = pcsRef.current.get(from);
      if (pc) {
        try {
          (pc as AnyRTCPeerConnection).close();
        } catch {}
        pcsRef.current.delete(from);
        peerRoomRef.current.delete(from);
        stopRxMonitor();
      }
    };

    socket.on("connect", onConnect);
    socket.on("offer", onOffer);
    socket.on("ice-candidate", onIce);
    socket.on("bye", onBye);

    return () => {
      InCallManager.stop();
      try {
        const rooms = initialJoinedRooms;
        for (const r of rooms) socket.emit("leave", { room: r });
      } catch {}
      socket.off("connect", onConnect);
      socket.off("offer", onOffer);
      socket.off("ice-candidate", onIce);
      socket.off("bye", onBye);
      socket.disconnect();
      socketRef.current = null;

      pcs.forEach((pc) => {
        try {
          (pc as AnyRTCPeerConnection).close();
        } catch {}
      });
      pcs.clear();
      peerRooms.clear();
      stopRxMonitor();
      joinedRooms.clear();
    };
  }, [
    roomCode,
    currentTargetRoom,
    getOrCreatePC,
    applyRemoteOfferAndAnswer,
    joinRoomsForTarget,
    stopRxMonitor,
  ]);

  useEffect(() => {
    if (!audioLang?.code) return;
    joinRoomsForTarget(audioLang.code).catch(() => {});
  }, [audioLang?.code, joinRoomsForTarget]);

  function WaveformStub() {
    const base = Math.min(28, 4 + Math.round(rx.level * 80));
    return (
      <View style={styles.waveContainer}>
        {Array.from({ length: 20 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.waveBar,
              {
                height: 6 + (((i * 7) % 20) + base),
                opacity: rx.isReceiving ? 1 : 0.35,
              },
            ]}
          />
        ))}
      </View>
    );
  }

  function leaveSession() {
    router.back();
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      <Stack.Screen options={{ title: "Sessão" }} />

      {error && (
        <View
          style={{
            padding: 12,
            backgroundColor: "#FEE2E2",
            borderColor: "#EF4444",
            borderWidth: 1,
          }}>
          <Text style={{ color: "#B91C1C", fontWeight: "700" }}>Erro</Text>
          <Text style={{ color: "#B91C1C" }}>{error}</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 20 + safePadBottom },
        ]}>
        <View style={styles.headerRow}>
          <Text numberOfLines={2} style={styles.titleText}>
            {room?.name || "Sessão"}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>
          Áudio:{" "}
          <Text style={{ fontWeight: "600" }}>{audioLang?.label ?? "—"}</Text>
        </Text>

        <View style={styles.cardBox}>
          <WaveformStub />
          <View style={{ marginTop: 10, gap: 6 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: rx.isReceiving ? GREEN : GRAY },
                ]}
              />
              <Text
                style={{
                  color: rx.isReceiving ? GREEN : "#6B7280",
                  fontWeight: "700",
                }}>
                {rx.isReceiving ? "Online" : "Offline"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.rowButtons}>
          <TouchableOpacity
            style={[styles.btn, styles.btnOutline]}
            onPress={() => openSheet()}>
            <Text style={styles.btnOutlineText}>Trocar idioma</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={leaveSession}>
            <Text style={styles.btnPrimaryText}>Sair da sessão</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {sheetVisible && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Animated.View
            style={[styles.overlay, { opacity: overlayOpacity }]}
          />
          <Animated.View
            style={[
              styles.sheet,
              { transform: [{ translateY }], paddingBottom: safePadBottom },
            ]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{"Áudio"}</Text>
              <Pressable hitSlop={10} onPress={() => closeSheet(false)}>
                <Text style={styles.sheetClose}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.sheetSubtitle}>
              {"Selecione o idioma desejado:"}
            </Text>

            <ScrollView
              style={{ maxHeight: 300 }}
              keyboardShouldPersistTaps="handled">
              {languageOptions.map((opt) => {
                const curr = audioLang;
                const checked = (tempLang ?? curr)?.code === opt.code;
                return (
                  <Pressable
                    key={opt.code}
                    onPress={() => setTempLang(opt)}
                    style={({ pressed }) => [
                      styles.optionRow,
                      pressed && { backgroundColor: "#F3F4F6" },
                    ]}>
                    <Text style={styles.optionText}>{opt.label}</Text>
                    <View
                      style={[
                        styles.radioOuter,
                        checked && styles.radioOuterActive,
                      ]}>
                      {checked && <View style={styles.radioInner} />}
                    </View>
                  </Pressable>
                );
              })}
              {languageOptions.length === 0 && (
                <Text style={{ color: "#6B7280", padding: 12 }}>
                  Nenhum idioma disponível.
                </Text>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, { marginTop: 16 }]}
              onPress={() => closeSheet(true)}>
              <Text style={styles.btnPrimaryText}>Salvar</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#9CA3AF",
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: { flex: 1, fontSize: 20, fontWeight: "700", color: "#1F2937" },
  sectionLabel: { color: "#4B5563", marginTop: 6, marginBottom: 6 },
  cardBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
  },
  waveContainer: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  waveBar: { width: 6, borderRadius: 3, backgroundColor: "#111827" },
  dot: { width: 10, height: 10, borderRadius: 5 },
  rowButtons: { flexDirection: "row", gap: 12, marginTop: 6 },
  btn: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  },
  btnPrimary: { backgroundColor: BLUE },
  btnPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  btnOutline: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    flexDirection: "row",
    gap: 8,
  },
  btnOutlineText: { color: "#111827", fontWeight: "700", fontSize: 16 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "#000" },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 14,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 4,
  },
  sheetIcon: { fontSize: 18 },
  sheetTitle: { flex: 1, fontSize: 16, fontWeight: "700", color: "#111827" },
  sheetClose: { fontSize: 18, color: "#6B7280" },
  sheetSubtitle: { color: "#6B7280", marginBottom: 10 },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  optionText: { fontSize: 16, color: "#111827" },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#9CA3AF",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterActive: { borderColor: BLUE },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: BLUE },
});
