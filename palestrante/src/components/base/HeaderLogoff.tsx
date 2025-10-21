"use client";

import { Button } from "@mui/material";
import { AuthContextProvider } from "@/contexts/AuthContext";

export default function HeaderLogoff() {
  const { logoff } = AuthContextProvider(); // chama o hook/função do contexto

  return (
    <Button
      type="button"
      onClick={() => logoff()}
      style={{
        textDecoration: "none",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 14,
        color: "#000000",
      }}>
      Sair
    </Button>
  );
}
