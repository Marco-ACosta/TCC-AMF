export function formatEpochBR(ts?: number): string {
  if (ts === undefined || ts === null) return "";
  const n = Number(ts);
  if (Number.isNaN(n)) return "";
  const ms = String(n).length <= 10 ? n * 1000 : n;
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(ms));
  } catch {
    return "";
  }
}
