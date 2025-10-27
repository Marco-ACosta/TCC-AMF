"use client";

import { Typography } from "@mui/material";

export default function UserFormHeader({ title }: { title: string }) {
  return (
    <Typography variant="h5" component="h2" sx={{ mb: 1 }}>
      {title}
    </Typography>
  );
}
