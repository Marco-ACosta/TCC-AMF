"use client";

import { Chip, Typography } from "@mui/material";
import { LangPair, Language } from "@/types/room";

type Props = { pairs?: LangPair[] };

export default function LangPairs({ pairs }: Props) {
  if (!pairs || pairs.length === 0) {
    return <span style={{ opacity: 0.7 }}>Sem pares de idioma.</span>;
  }

  const labelOf = (lang?: Language) =>
    [lang?.name, lang?.code].filter(Boolean).join(" — ") || "—";

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {pairs.map((p, idx) => {
        const rowKey = `pair-${String(p.source?.id ?? "src")}-${String(
          p.target?.id ?? "tgt"
        )}-${idx}`;

        return (
          <div
            key={rowKey}
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
            }}>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Origem:
            </Typography>
            <Chip label={labelOf(p.source)} variant="outlined" size="small" />
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Destino:
            </Typography>
            <Chip label={labelOf(p.target)} variant="outlined" size="small" />
          </div>
        );
      })}
    </div>
  );
}
