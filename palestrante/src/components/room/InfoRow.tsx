"use client";

import { Typography } from "@mui/material";
import { CSSProperties } from "react";

type Props = {
  label: string;
  value?: string | null;
  minLabelWidth?: number;
  style?: CSSProperties;
};

export default function InfoRow({
  label,
  value,
  minLabelWidth = 120,
  style,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "baseline",
        flexWrap: "wrap",
        ...style,
      }}>
      <Typography
        variant="body2"
        sx={{ opacity: 0.7, minWidth: minLabelWidth }}>
        {label}
      </Typography>
      <Typography variant="body1">{value ?? "—"}</Typography>
    </div>
  );
}
