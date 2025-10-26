"use client";

import Screen from "@/components/base/Screen";
import Box from "@/components/base/Box";
import { Typography } from "@mui/material";
import { LocalStorage } from "@/storage/LocalStorage";
import MicLevelPanel from "@/components/webrtc/MicLevelPanel";
import env from "@/config/env";
import { useSpeakerCall } from "@/hooks/useSpeakerCall";

export default function SpeakerPage({ params }: { params: { room: string } }) {
  const roomCode = params.room;
  const meId = LocalStorage.userId.get() ?? null;

  const { details, micLevel } = useSpeakerCall({
    roomCode,
    meId,
    signalingURL: env.SignalingURL(),
    signalingPath: "/signal",
    iceServers: [],
  });

  return (
    <Screen>
      <Box.Column style={{ gap: 16 }}>
        <Typography variant="h2">Sala: {details?.name ?? roomCode}</Typography>
        <MicLevelPanel value={micLevel} />
      </Box.Column>
    </Screen>
  );
}
