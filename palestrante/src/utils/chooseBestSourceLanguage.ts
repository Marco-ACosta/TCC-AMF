import type { RoomDetails, Translator } from "@/types/room";

export function chooseBestSourceLanguage(d: RoomDetails | null): string {
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
}
