import sounddevice as sd
import numpy as np

DURATION = 5  # segundos
FS = 16000    # taxa de amostragem

print(f"Gravando áudio do microfone por {DURATION} segundos...")

# Grava áudio
recording = sd.rec(int(DURATION * FS), samplerate=FS, channels=1, dtype='int16')
sd.wait()  # espera fim da gravação

print("Gravação finalizada. Reproduzindo áudio gravado...")

# Reproduz áudio gravado
sd.play(recording, FS)
sd.wait()

print("Playback finalizado.")
