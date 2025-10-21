"use client";

import { CircularProgress } from "@mui/material";

export function LoadingBlock() {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}>
      <CircularProgress size={22} />
      <span>Carregando…</span>
    </div>
  );
}

export function ErrorBlock({ error }: { error: string }) {
  return (
    <p style={{ color: "red", marginTop: 8, textAlign: "center" }}>{error}</p>
  );
}

export function EmptyBlock({ message }: { message: string }) {
  return <p style={{ opacity: 0.8, textAlign: "center" }}>{message}</p>;
}
