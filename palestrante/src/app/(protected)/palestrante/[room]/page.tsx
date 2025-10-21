"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Screen from "@/components/base/Screen";
import Box from "@/components/base/Box";
import io from "socket.io-client";
import env from "@/config/env";
import {
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import RoomService from "@/services/api/roomService";

type Language = { id: number | string; code?: string; name?: string };
type Speaker = {
  id: number | string;
  name: string;
  bio?: string | null;
  languages: Language[];
};
type Translator = { id: number | string; name: string; languages: Language[] };
type RoomDetails = {
  code: string;
  name: string;
  description: string;
  speakers: Speaker[];
  translators: Translator[];
};

type IceServer = {
  urls: string | string[];
  username?: string;
  credential?: string;
};

const iceServers: IceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

export default function RoomPage({ params }: { params: { room: string } }) {
  const room = params.room;

  const socket = useMemo(() => {
    const baseURL = env.SignalingURL();
    return io(baseURL, {
      transports: ["polling", "websocket"],
      path: "/socket.io",
      withCredentials: false,
    });
  }, []);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [canStart, setCanStart] = useState(false);
  const [roomSize, setRoomSize] = useState(1);

  const [details, setDetails] = useState<RoomDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const [connecting, setConnecting] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setDetailsLoading(true);
        setDetailsError(null);

        const res = await RoomService.GetRoom(room);
        const raw = res?.Data ?? res;

        const vm: RoomDetails | null = raw
          ? {
              code: String(raw.code ?? room),
              name: String(raw.name ?? ""),
              description: String(raw.description ?? ""),
              speakers: Array.isArray(raw.speakers)
                ? raw.speakers.map((s: any) => ({
                    id: s.id,
                    name: String(s.name ?? ""),
                    bio: s.bio ?? null,
                    languages: Array.isArray(s.languages)
                      ? s.languages.map((l: any) => ({
                          id: l.id,
                          code: l.code,
                          name: l.name,
                        }))
                      : [],
                  }))
                : [],
              translators: Array.isArray(raw.translators)
                ? raw.translators.map((t: any) => ({
                    id: t.id,
                    name: String(t.name ?? ""),
                    languages: Array.isArray(t.languages)
                      ? t.languages.map((l: any) => ({
                          id: l.id,
                          code: l.code,
                          name: l.name,
                        }))
                      : [],
                  }))
                : [],
            }
          : null;

        if (!alive) return;
        setDetails(vm);
      } catch (e: any) {
        if (!alive) return;
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "Falha ao carregar detalhes da sala.";
        setDetailsError(msg);
      } finally {
        if (alive) setDetailsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [room]);

  // ====== WebRTC + Sinalização ======
  useEffect(() => {
    const pc = new RTCPeerConnection({ iceServers });
    pcRef.current = pc;

    pc.ontrack = (evt) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = evt.streams[0];
        (remoteAudioRef.current as HTMLAudioElement).play().catch(() => {});
      }
    };

    pc.onicecandidate = (evt) => {
      if (evt.candidate) {
        socket.emit("ice-candidate", { room, candidate: evt.candidate });
      }
    };

    socket.on("connect", () => {
      setConnecting(false);
      socket.emit("join", { room });
    });

    socket.on("disconnect", () => setConnecting(true));

    // mantém tracking de tamanho da sala e, se vierem metadados, atualiza também
    socket.on("room-info", (data: any) => {
      const size = Array.isArray(data?.members)
        ? data.members.length
        : data?.room_size ?? 1;
      setRoomSize(size);
      setCanStart(size >= 2);

      if (data?.code && data?.name) {
        setDetails((prev) => ({
          code: String(data.code ?? prev?.code ?? room),
          name: String(data.name ?? prev?.name ?? ""),
          description: String(data.description ?? prev?.description ?? ""),
          speakers: Array.isArray(data.speakers)
            ? data.speakers
            : prev?.speakers ?? [],
          translators: Array.isArray(data.translators)
            ? data.translators
            : prev?.translators ?? [],
        }));
      }
    });

    socket.on("peer-joined", () => {
      setRoomSize((n) => {
        const next = n + 1;
        setCanStart(next >= 2);
        return next;
      });
    });

    socket.on("offer", async (data: any) => {
      const desc = new RTCSessionDescription(data.offer);
      await pc.setRemoteDescription(desc);

      if (!pc.getSenders().length) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          localStreamRef.current = stream;
          if (localAudioRef.current) localAudioRef.current.srcObject = stream;
          stream.getTracks().forEach((t) => pc.addTrack(t, stream));
        } catch {
          // usuário negou microfone ou não há dispositivo
        }
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { room, answer });
    });

    socket.on("answer", async (data: any) => {
      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    });

    socket.on("ice-candidate", async (data: any) => {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (err) {
        console.error("Error adding ICE candidate", err);
      }
    });

    socket.on("peer-left", () => {
      setRoomSize((n) => {
        const next = Math.max(1, n - 1);
        setCanStart(next >= 2);
        return next;
      });
    });

    return () => {
      socket.emit("leave", { room });
      socket.removeAllListeners();

      if (pc.getSenders) pc.getSenders().forEach((s) => s.track?.stop());
      pc.close();

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, socket]);

  async function startCall() {
    const pc = pcRef.current;
    if (!pc) return;
    if (pc.signalingState !== "stable" || pc.localDescription) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      if (localAudioRef.current) localAudioRef.current.srcObject = stream;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    } catch {
      return;
    }

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("offer", { room, offer });
  }

  const renderLanguages = (langs?: Language[]) => {
    if (!langs || langs.length === 0)
      return <span style={{ opacity: 0.7 }}>Sem idiomas.</span>;
    return (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {langs.map((l) => (
          <Chip
            key={String(l.id)}
            label={[l.name, l.code].filter(Boolean).join(" — ")}
            variant="outlined"
            size="small"
          />
        ))}
      </div>
    );
  };

  const copyCode = () => {
    if (!details?.code) return;
    navigator.clipboard.writeText(details.code).catch(() => {});
  };

  const InfoRow = ({ label, value }: { label: string; value?: string }) => (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "baseline",
        flexWrap: "wrap",
      }}>
      <Typography variant="body2" sx={{ opacity: 0.7, minWidth: 120 }}>
        {label}
      </Typography>
      <Typography variant="body1">{value || "—"}</Typography>
    </div>
  );

  return (
    <Screen>
      <Box.Center
        style={{
          alignContent: "center",
          justifyContent: "center",
          height: "100%",
          width: "100%",
        }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 16,
            width: "100%",
            maxWidth: 980,
            margin: "0 auto",
            padding: 16,
          }}>
          {/* Cabeçalho */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              justifyContent: "space-between",
            }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <h1 style={{ margin: 0 }}>Sala</h1>
              <span style={{ opacity: 0.8, fontSize: 12 }}>
                Pessoas conectadas na sala: {roomSize}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {connecting && (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <CircularProgress size={18} />
                  <span style={{ fontSize: 12, opacity: 0.8 }}>
                    Conectando…
                  </span>
                </div>
              )}
              <Button
                onClick={startCall}
                variant="outlined"
                disabled={!canStart}
                title={
                  canStart
                    ? "Iniciar chamada"
                    : "Aguardando outra pessoa entrar"
                }>
                Iniciar chamada (áudio)
              </Button>
            </div>
          </div>

          {/* Painel principal (call + info) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
            {/* Bloco da chamada / áudio */}
            <Paper
              variant="outlined"
              style={{
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}>
              <Typography variant="h6" sx={{ m: 0 }}>
                Chamada
              </Typography>
              <Divider />
              {/* Elementos de áudio invisíveis para manter a conexão */}
              <audio
                ref={localAudioRef}
                autoPlay
                muted
                style={{ display: "none" }}
              />
              <audio
                ref={remoteAudioRef}
                autoPlay
                style={{ display: "none" }}
              />
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                A chamada de áudio inicia quando houver outra pessoa na sala.
              </Typography>
            </Paper>

            {/* Bloco: informações da sala (somente leitura) */}
            <Paper
              variant="outlined"
              style={{
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}>
              <Typography variant="h6" sx={{ m: 0 }}>
                Informações da sala
              </Typography>
              <Divider />

              {detailsLoading && (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <CircularProgress size={18} />
                  <span style={{ fontSize: 12, opacity: 0.8 }}>
                    Carregando detalhes…
                  </span>
                </div>
              )}

              {!!detailsError && (
                <Typography color="error" variant="body2">
                  {detailsError}
                </Typography>
              )}

              {!detailsLoading && !detailsError && (
                <>
                  <InfoRow label="Nome" value={details?.name} />
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}>
                    <InfoRow label="Código da sala" value={details?.code} />
                    <Tooltip title="Copiar código">
                      <Button
                        variant="outlined"
                        onClick={copyCode}
                        size="small">
                        Copiar
                      </Button>
                    </Tooltip>
                  </div>
                  <div>
                    <Typography variant="body2" sx={{ opacity: 0.7, mb: 0.5 }}>
                      Descrição
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                      {details?.description || "Sem descrição."}
                    </Typography>
                  </div>
                </>
              )}
            </Paper>

            {/* Bloco: Speakers */}
            <Paper
              variant="outlined"
              style={{
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}>
              <Typography variant="h6" sx={{ m: 0 }}>
                Palestrantes
              </Typography>
              <Divider />
              {detailsLoading && (
                <span style={{ opacity: 0.7 }}>Carregando…</span>
              )}
              {!detailsLoading && (details?.speakers ?? []).length === 0 && (
                <span style={{ opacity: 0.7 }}>Nenhum speaker cadastrado.</span>
              )}
              {(details?.speakers ?? []).map((sp) => (
                <Paper
                  key={`sp-${sp.id}`}
                  variant="outlined"
                  style={{
                    padding: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}>
                  <InfoRow label="Nome" value={sp.name} />
                  {sp.bio && <InfoRow label="Bio" value={sp.bio} />}
                  <div>
                    <Typography variant="body2" sx={{ opacity: 0.7, mb: 0.5 }}>
                      Idiomas
                    </Typography>
                    {renderLanguages(sp.languages)}
                  </div>
                </Paper>
              ))}
            </Paper>

            {/* Bloco: Translators */}
            <Paper
              variant="outlined"
              style={{
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}>
              <Typography variant="h6" sx={{ m: 0 }}>
                Tradutores
              </Typography>
              <Divider />
              {detailsLoading && (
                <span style={{ opacity: 0.7 }}>Carregando…</span>
              )}
              {!detailsLoading && (details?.translators ?? []).length === 0 && (
                <span style={{ opacity: 0.7 }}>
                  Nenhum translator cadastrado.
                </span>
              )}
              {(details?.translators ?? []).map((tr) => (
                <Paper
                  key={`tr-${tr.id}`}
                  variant="outlined"
                  style={{
                    padding: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}>
                  <InfoRow label="Nome" value={tr.name} />
                  <div>
                    <Typography variant="body2" sx={{ opacity: 0.7, mb: 0.5 }}>
                      Idiomas
                    </Typography>
                    {renderLanguages(tr.languages)}
                  </div>
                </Paper>
              ))}
            </Paper>
          </div>
        </div>
      </Box.Center>
    </Screen>
  );
}
