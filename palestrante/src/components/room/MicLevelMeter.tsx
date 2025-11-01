"use client";

import { useMemo } from "react";
import { Box, LinearProgress, Typography } from "@mui/material";

type MicLevelMeterProps = {
  micLevel: number;
  label?: string;
  showDb?: boolean;
};

function toDbfs(v: number) {
  const clamped = Math.max(v, 1e-6);
  return 20 * Math.log10(clamped);
}

export default function MicLevelMeter({
  micLevel,
  label = "Saída",
  showDb = true,
}: MicLevelMeterProps) {
  const pct = Math.min(100, Math.max(1, micLevel * 1000));
  const db = useMemo(() => toDbfs(micLevel), [micLevel]);

  return (
    <Box display="flex" alignItems="center" gap={1.5} minWidth={280}>
      <Typography variant="body2" sx={{ width: 56 }}>
        {label}
      </Typography>

      <Box flex={1}>
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{
            height: 12,
            borderRadius: 6,
            backgroundColor: "rgba(0,0,0,0.08)",
            "& .MuiLinearProgress-bar": {
              borderRadius: 6,
              backgroundColor: "#22c55e",
            },
          }}
        />
      </Box>

      <Box width={110} textAlign="right">
        <Typography variant="caption">
          {showDb ? ` • ${db.toFixed(1)} dBFS` : ""}
        </Typography>
      </Box>
    </Box>
  );
}
