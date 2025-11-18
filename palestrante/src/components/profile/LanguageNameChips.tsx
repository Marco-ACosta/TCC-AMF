"use client";

import { Chip } from "@mui/material";
import { Language } from "@/types/language";

type Props = { languages?: Language[] };

export default function LanguageNameChips({ languages }: Props) {
  if (!languages || languages.length === 0) {
    return <span style={{ opacity: 0.7 }}>Sem idiomas.</span>;
  }
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {languages.map((l) => (
        <Chip
          key={String(l.id)}
          label={[l.name].filter(Boolean).join(" — ")}
          variant="outlined"
          size="small"
        />
      ))}
    </div>
  );
}
