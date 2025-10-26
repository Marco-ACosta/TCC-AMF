"use client";

import { Paper, Typography, LinearProgress } from "@mui/material";

export default function MicLevelPanel({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <Paper
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
        padding: 12,
        width: "100%",
        maxWidth: 560,
      }}>
      <Typography variant="body2" component="div">
        Volume de saída: <strong>{clamped.toFixed(3)}</strong>
      </Typography>
      <div style={{ flex: 1, minWidth: 180 }}>
        <LinearProgress
          variant="determinate"
          value={clamped * 100}
          aria-label="nível do microfone"
        />
      </div>
    </Paper>
  );
}
