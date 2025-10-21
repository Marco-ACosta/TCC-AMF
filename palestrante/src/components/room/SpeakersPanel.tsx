"use client";

import { Divider, Paper, Typography } from "@mui/material";
import { Speaker } from "@/types/room";
import InfoRow from "./InfoRow";
import LanguagesChips from "./LanguagesChips";

type Props = {
  loading?: boolean;
  speakers?: Speaker[];
};

export default function SpeakersPanel({ loading, speakers }: Props) {
  return (
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
      {loading && <span style={{ opacity: 0.7 }}>Carregando…</span>}
      {!loading && (speakers ?? []).length === 0 && (
        <span style={{ opacity: 0.7 }}>Nenhum speaker cadastrado.</span>
      )}
      {(speakers ?? []).map((sp) => (
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
            <LanguagesChips languages={sp.languages} />
          </div>
        </Paper>
      ))}
    </Paper>
  );
}
