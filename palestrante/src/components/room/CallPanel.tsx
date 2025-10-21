"use client";

import { Divider, Paper, Typography } from "@mui/material";
import { RefObject } from "react";

type Props = {
  localAudioRef: RefObject<HTMLAudioElement>;
  remoteAudioRef: RefObject<HTMLAudioElement>;
};

export default function CallPanel({ localAudioRef, remoteAudioRef }: Props) {
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
        Chamada
      </Typography>
      <Divider />
      <audio ref={localAudioRef} autoPlay muted style={{ display: "none" }} />
      <audio ref={remoteAudioRef} autoPlay style={{ display: "none" }} />
      <Typography variant="body2" sx={{ opacity: 0.8 }}>
        A chamada de áudio inicia quando houver outra pessoa na sala.
      </Typography>
    </Paper>
  );
}
