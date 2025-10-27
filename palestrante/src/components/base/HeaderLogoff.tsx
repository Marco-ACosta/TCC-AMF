"use client";

import { AuthContextProvider } from "@/contexts/AuthContext";
import { Link, Typography } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";

export default function HeaderLogoff() {
  const { logoff } = AuthContextProvider();
  return (
    <Link
      onClick={() => logoff()}
      style={{
        textAlign: "center",
        textDecoration: "none",
        display: "block",
        borderBottom: "1px solid #00000080",
        paddingBottom: 8,
        color: "black",
      }}>
      <LogoutIcon />
      <Typography
        variant="h2"
        style={{ padding: 8, fontSize: 18, textAlign: "center" }}>
        Sair
      </Typography>
    </Link>
  );
}
