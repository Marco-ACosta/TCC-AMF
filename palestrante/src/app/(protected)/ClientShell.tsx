"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Auth from "@/components/base/Auth";
import { LocalStorage } from "@/storage/LocalStorage";
import { Typography } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import GroupIcon from "@mui/icons-material/Group";
import MicIcon from "@mui/icons-material/Mic";
import HeaderLogoff from "@/components/base/HeaderLogoff";
const MENU_W = "15vw";

export default function ClientShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    try {
      const r = LocalStorage.userRole.get();
      if (!r) {
        LocalStorage.logoff();
        return;
      }
      setRole(r);
    } catch {}
  }, []);

  if (!role) return null;

  return (
    <Auth>
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: MENU_W,
          borderRight: "1px solid #e5e7eb",
          boxSizing: "border-box",
          background: "white",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}>
        <Typography
          variant="h5"
          style={{ padding: 8, paddingTop: 48, textAlign: "center" }}>
          Menu
        </Typography>
        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            justifyItems: "center",
          }}>
          <Link
            href={`/${role}/perfil`}
            style={{
              textAlign: "center",
              textDecoration: "none",
              display: "block",
              borderBottom: "1px solid #00000080",
              paddingBottom: 8,
            }}>
            <PersonIcon />
            <Typography
              variant="h2"
              style={{ padding: 8, fontSize: 18, textAlign: "center" }}>
              Perfil
            </Typography>
          </Link>
          <Link
            href={`/${role}`}
            style={{
              textAlign: "center",
              textDecoration: "none",
              display: "block",
              borderBottom: "1px solid #00000080",
              paddingBottom: 8,
            }}>
            <MicIcon />
            <Typography
              variant="h2"
              style={{ padding: 8, fontSize: 18, textAlign: "center" }}>
              Salas
            </Typography>
          </Link>
          {role === "admin" && (
            <Link
              href={`/${role}/usuarios`}
              style={{
                textAlign: "center",
                textDecoration: "none",
                display: "block",
                borderBottom: "1px solid #00000080",
                paddingBottom: 8,
              }}>
              <GroupIcon />
              <Typography
                variant="h2"
                style={{ padding: 8, fontSize: 18, textAlign: "center" }}>
                Usuários
              </Typography>
            </Link>
          )}
          <HeaderLogoff />
        </nav>
      </aside>

      <main
        style={{
          width: `calc(100vw - ${MENU_W})`,
          marginLeft: MENU_W,
          minHeight: "100vh",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          background: "white",
        }}>
        <section
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            overflow: "auto",
          }}>
          <div style={{ width: "100%", maxWidth: 960 }}>{children}</div>
        </section>
      </main>
    </Auth>
  );
}
