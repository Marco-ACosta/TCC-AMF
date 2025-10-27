"use client";

import { Typography } from "@mui/material";

export default function RoomsHeader({ count }: { count: number }) {
  return (
    <div style={{ textAlign: "center" }}>
      <Typography style={{ textAlign: "left" }} typography={"h5"}>
        Salas
      </Typography>
      <Typography typography={"caption"} style={{ opacity: 0.6 }}>
        {count > 0
          ? `${count} ${count === 1 ? `sala encontrada` : `salas encontradas`}`
          : "—"}
      </Typography>
    </div>
  );
}
