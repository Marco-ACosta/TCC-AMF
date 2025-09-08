import asyncio
import logging
import json
import sounddevice as sd
import numpy as np

from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaPlayer, MediaRelay

# Configurações
SERVER_IP = "127.0.0.1"  # IP do servidor de transcrição
SERVER_PORT = 8080       # Porta do servidor de transcrição

# Configuração de log para aiortc
# logging.basicConfig(level=logging.DEBUG) # Descomente para ver logs detalhados do aiortc

class MicrophoneWebRTCClient:
    def __init__(self, server_url):
        self.server_url = server_url
        self.pc = None
        self.audio_track = None
        self.relay = MediaRelay()
        self.player = None
        self.microphone_stream = None
        self.sample_rate = 16000  # Taxa de amostragem (Hz)
        self.channels = 1         # Mono

    async def start(self):
        """Inicia a conexão WebRTC e envia o áudio do microfone."""
        self.pc = RTCPeerConnection()

        @self.pc.on("connectionstatechange")
        async def on_connectionstatechange():
            print(f"Estado da conexão WebRTC: {self.pc.connectionState}")
            if self.pc.connectionState == "failed":
                print("Conexão WebRTC falhou. Fechando...")
                await self.pc.close()

        print("Capturando áudio do microfone...")
        try:
            # Inicializa o stream do microfone
            self.microphone_stream = sd.InputStream(
                samplerate=self.sample_rate,
                channels=self.channels,
                dtype='int16' # Usamos int16 para áudio PCM, que é comum em WebRTC
            )
            self.microphone_stream.start()

            # Cria um player a partir do stream do microfone.
            # O aiortc espera um objeto que possa fornecer frames de áudio.
            # Vamos usar um wrapper simples para transformar o stream do sounddevice em um "track"
            # compatível com aiortc.
            self.player = MicAudioTrack(self.microphone_stream, self.sample_rate, self.channels)
            self.audio_track = self.relay.subscribe(self.player)
            self.pc.addTrack(self.audio_track)

        except Exception as e:
            print(f"Erro ao iniciar o microfone: {e}")
            return

        # Cria a oferta SDP (Session Description Protocol)
        offer = await self.pc.createOffer()
        await self.pc.setLocalDescription(offer)

        print(f"Oferta SDP criada. Enviando para {self.server_url}...")

        # Simula o envio da oferta para o servidor (em um ambiente real, seria via WebSocket ou HTTP)
        # Por enquanto, vamos imprimir e você precisaria copiar/colar no servidor
        # Em breve, integraremos com WebSockets para automatizar isso.
        print("\n--- COPIE E COLE ISSO NO CÓDIGO DO SERVIDOR DE TRANSCRIÇÃO ---\n")
        print(json.dumps({
            "sdp": self.pc.localDescription.sdp,
            "type": self.pc.localDescription.type
        }))
        print("\n---------------------------------------------------------------\n")

        # Espera a resposta do servidor (a "answer" SDP)
        # Para fins de teste inicial, vamos esperar a entrada manual.
        # No próximo passo, isto será via WebSocket.
        print("Aguardando a 'answer' SDP do servidor (cole aqui e pressione Enter):")
        while True:
            try:
                line = await asyncio.to_thread(input) # Usa asyncio.to_thread para input bloqueante
                obj = json.loads(line)
                if isinstance(obj, dict) and "sdp" in obj and "type" in obj:
                    answer = RTCSessionDescription(sdp=obj["sdp"], type=obj["type"])
                    await self.pc.setRemoteDescription(answer)
                    print("Resposta SDP do servidor recebida e configurada!")
                    break
                else:
                    print("Formato JSON inválido. Tente novamente.")
            except json.JSONDecodeError:
                print("Entrada inválida. Não é um JSON válido. Tente novamente.")
            except Exception as e:
                print(f"Erro ao processar entrada: {e}. Tente novamente.")

        print("Conexão WebRTC estabelecida. Enviando áudio...")

        # Mantém a conexão aberta
        try:
            while True:
                await asyncio.sleep(1) # Mantém o loop ativo
        except asyncio.CancelledError:
            pass # A tarefa foi cancelada, então saímos do loop

    async def stop(self):
        """Para a conexão WebRTC e o stream do microfone."""
        if self.pc:
            await self.pc.close()
            print("Conexão WebRTC fechada.")
        if self.microphone_stream and self.microphone_stream.started:
            self.microphone_stream.stop()
            self.microphone_stream.close()
            print("Stream do microfone parado.")

# --- Classe auxiliar para transformar sounddevice stream em aiortc track ---
from aiortc.mediastreams import AudioFrame, MediaStreamTrack
from collections import deque

class MicAudioTrack(MediaStreamTrack):
    """
    Um MediaStreamTrack de áudio que lê dados de um stream do sounddevice.
    """
    kind = "audio"

    def __init__(self, stream, sample_rate, channels):
        super().__init__()
        self._stream = stream
        self._sample_rate = sample_rate
        self._channels = channels
        self._buffer = deque()
        self._frame_size = int(self._sample_rate * 0.02) # 20ms de áudio por frame

    async def recv(self):
        """
        Lê um frame de áudio do microfone.
        """
        while len(self._buffer) < self._frame_size:
            data, overflowed = self._stream.read(self._frame_size * 2) # Lê um pouco mais para ter certeza
            if data.size > 0:
                # Converte os dados do sounddevice (numpy array) para bytes
                # e adiciona ao buffer
                self._buffer.extend(data.tobytes())
            if overflowed:
                print("AVISO: Buffer de áudio do microfone transbordou!")

        # Pega a quantidade exata de dados para um frame
        frame_data_bytes = bytes([self._buffer.popleft() for _ in range(self._frame_size * 2)]) # *2 porque int16 tem 2 bytes por amostra

        # Cria o AudioFrame do aiortc
        frame = AudioFrame(
            channels=self._channels,
            format="s16", # signed 16-bit PCM
            layout="mono",
            samples=self._frame_size,
            sample_rate=self._sample_rate,
            data=frame_data_bytes
        )
        return frame

# --- Função principal para execução ---
async def main():
    client = MicrophoneWebRTCClient(f"ws://{SERVER_IP}:{SERVER_PORT}")
    try:
        await client.start()
    except KeyboardInterrupt:
        print("\nCliente encerrado pelo usuário.")
    finally:
        await client.stop()

if __name__ == "__main__":
    # Verifica dispositivos de áudio
    print("Dispositivos de áudio disponíveis:")
    print(sd.query_devices())
    print("-" * 30)

    # Inicia o loop de eventos assíncrono
    asyncio.run(main())