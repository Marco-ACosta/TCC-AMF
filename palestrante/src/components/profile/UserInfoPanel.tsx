"use client";

import { Divider, Paper, Typography } from "@mui/material";
import { ProfileVM } from "@/types/profile";
import { formatEpochBR } from "@/utils/datetime";
import InfoRow from "@/components/room/InfoRow";

type Props = { profile?: ProfileVM | null };

export default function UserInfoPanel({ profile }: Props) {
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
        Informações do usuário
      </Typography>
      <Divider />
      <InfoRow label="Nome" value={profile?.name ?? ""} />
      <InfoRow label="E-mail" value={profile?.email ?? ""} />
    </Paper>
  );
}
