"use client";

import { Divider, Paper, Typography } from "@mui/material";
import { RoleProfile } from "@/types/profile";
import LanguageNameChips from "./LanguageNameChips";

type Props = {
  title: string;
  role?: RoleProfile;
};

export default function RoleLanguagesPanel({ title, role }: Props) {
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
        {title}
      </Typography>
      <Divider />
      {role ? (
        <LanguageNameChips languages={role.languages} />
      ) : (
        <span style={{ opacity: 0.7 }}>Sem {title.toLowerCase()}.</span>
      )}
    </Paper>
  );
}
