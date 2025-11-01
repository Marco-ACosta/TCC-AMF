"use client";

import { Divider, Paper, Typography } from "@mui/material";
import { Translator } from "@/types/room";
import InfoRow from "./InfoRow";
import LangPairs from "./LangPairs";
import { LoadingBlock } from "../base/LoadState";

type Props = {
  loading?: boolean;
  translators?: Translator[];
};

export default function TranslatorsPanel({ loading, translators }: Props) {
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
        Tradutores
      </Typography>
      <Divider />
      {loading && <LoadingBlock full />}
      {!loading && (translators ?? []).length === 0 && (
        <span style={{ opacity: 0.7 }}>Nenhum translator cadastrado.</span>
      )}
      {(translators ?? []).map((tr) => (
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
            <LangPairs pairs={(tr as any).pairs} />
          </div>
        </Paper>
      ))}
    </Paper>
  );
}
