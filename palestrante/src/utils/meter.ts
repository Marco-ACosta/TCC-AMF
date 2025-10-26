export function startAudioMeter(
  stream: MediaStream,
  onLevel: (level: number) => void
): () => void {
  const ACtx =
    (window as any).AudioContext || (window as any).webkitAudioContext;
  const ctx: AudioContext = new ACtx();

  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);

  const data = new Uint8Array(analyser.frequencyBinCount);
  let rafId = 0;

  const loop = () => {
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const level = Math.sqrt(sum / data.length);
    onLevel(level);
    rafId = requestAnimationFrame(loop);
  };

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  rafId = requestAnimationFrame(loop);

  return () => {
    try {
      cancelAnimationFrame(rafId);
    } catch {}
    try {
      source.disconnect();
    } catch {}
    try {
      analyser.disconnect();
    } catch {}
    try {
      ctx.close();
    } catch {}
  };
}
