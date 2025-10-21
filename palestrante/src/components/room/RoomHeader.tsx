"use client";

import { Button, CircularProgress } from "@mui/material";

type Props = {
  roomSize: number;
  connecting: boolean;
  canStart: boolean;
  onStartCall: () => void;
};

export default function RoomHeader({
  roomSize,
  connecting,
  canStart,
  onStartCall,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        justifyContent: "space-between",
      }}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <h1 style={{ margin: 0 }}>Sala</h1>
        <span style={{ opacity: 0.8, fontSize: 12 }}>
          Pessoas conectadas na sala: {roomSize}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {connecting && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <CircularProgress size={18} />
            <span style={{ fontSize: 12, opacity: 0.8 }}>Conectando…</span>
          </div>
        )}
        <Button
          onClick={onStartCall}
          variant="outlined"
          disabled={!canStart}
          title={
            canStart ? "Iniciar chamada" : "Aguardando outra pessoa entrar"
          }>
          Iniciar chamada (áudio)
        </Button>
      </div>
    </div>
  );
}
