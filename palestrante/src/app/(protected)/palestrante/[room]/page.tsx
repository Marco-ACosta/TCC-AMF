"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Screen from "@/components/base/Screen";
import io from "socket.io-client";

type IceServer = {
  urls: string | string[];
  username?: string;
  credential?: string;
};
const iceServers: IceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  // Em produção, configure também TURN:
  // { urls: "turn:SEU_TURN:3478", username: "user", credential: "pass" },
];

export default function RoomPage({ params }: { params: { room: string } }) {
  const room = params.room;

  const socket = useMemo(() => {
    // DICA: se sua página estiver em HTTPS, garanta que a URL seja "https://..." (wss)
    const baseURL = process.env.NEXT_PUBLIC_SIGNALING_URL as string; // ex.: http://localhost:5001  (dev)
    return io(baseURL, {
      // deixe as duas, na ordem padrão
      transports: ["polling", "websocket"],
      path: "/socket.io", // padrão do Flask-SocketIO
      withCredentials: false,
    });
  }, []);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [canStart, setCanStart] = useState(false);
  const [roomSize, setRoomSize] = useState(1);

  useEffect(() => {
    const pc = new RTCPeerConnection({ iceServers });
    pcRef.current = pc;

    pc.ontrack = (evt) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = evt.streams[0];
        // Tenta iniciar áudio imediatamente após vínculo do stream
        // (após gesto do usuário, navegadores costumam permitir autoplay)
        (remoteAudioRef.current as HTMLAudioElement).play().catch(() => {
          /* ignorar erros de autoplay */
        });
      }
    };

    pc.onicecandidate = (evt) => {
      if (evt.candidate) {
        socket.emit("ice-candidate", { room, candidate: evt.candidate });
      }
    };

    socket.on("connect", () => {
      socket.emit("join", { room });
    });

    // Snapshot do estado da sala ao entrar
    socket.on("room-info", (data: any) => {
      const size = Array.isArray(data?.members) ? data.members.length : 1;
      console.log(data.members);
      setRoomSize(size);
      setCanStart(size >= 2);
    });

    // Alguém entrou depois de você
    socket.on("peer-joined", () => {
      setRoomSize((n) => n + 1);
      setCanStart(true);
    });

    socket.on("offer", async (data: any) => {
      const desc = new RTCSessionDescription(data.offer);
      await pc.setRemoteDescription(desc);

      // Garante mídia local (apenas áudio) antes de responder
      if (!pc.getSenders().length) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          localStreamRef.current = stream;
          if (localAudioRef.current) {
            localAudioRef.current.srcObject = stream;
          }
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
      setRoomSize((n) => Math.max(1, n - 1));
      setCanStart((prev) => (roomSize - 1 >= 2 ? prev : false));
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

    // Evita glare/duplicação de oferta
    if (pc.signalingState !== "stable" || pc.localDescription) return;

    try {
      // Captura apenas ÁUDIO no início da chamada
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
      }
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    } catch {
      // usuário negou microfone ou não há dispositivo
      return;
    }

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("offer", { room, offer });
  }

  return (
    <Screen>
      <main className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Sala: {room}</h1>
        <p className="text-sm opacity-70">Peers na sala: {roomSize}</p>

        {/* Elementos de áudio: local (muted) e remoto */}
        <div className="space-y-2">
          <audio ref={localAudioRef} autoPlay muted className="w-full" />
          <audio ref={remoteAudioRef} autoPlay className="w-full" />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={startCall}
            disabled={!canStart}
            className="px-4 py-2 rounded-xl shadow"
            title={
              canStart ? "Iniciar chamada" : "Aguardando outro peer entrar"
            }>
            Iniciar chamada (áudio)
          </button>
        </div>
      </main>
    </Screen>
  );
}
