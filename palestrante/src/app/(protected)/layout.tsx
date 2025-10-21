import "../globals.css";
import Auth from "@/components/base/Auth";
import HeaderLogoff from "@/components/base/HeaderLogoff";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tradutor AMF",
};

const MENU_W = "15vw";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
        <h2 style={{ margin: "8px 0 16px 0", fontSize: 18 }}>Menu</h2>
        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            justifyItems: "center",
          }}>
          <Link
            href="/palestrante/perfil"
            style={{
              textAlign: "center",
              textDecoration: "none",
              display: "block",
              borderBottom: "1px solid #00000080",
              paddingBottom: 8,
            }}>
            Perfil
          </Link>
          <Link
            href="/palestrante"
            style={{
              textAlign: "center",
              textDecoration: "none",
              display: "block",
              borderBottom: "1px solid #00000080",
              paddingBottom: 8,
            }}>
            Salas
          </Link>
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
        <header
          style={{
            height: 56,
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            position: "sticky",
            top: 0,
            zIndex: 5,
            background: "white",
          }}>
          <strong style={{ fontSize: 16 }}>Tradutor AMF</strong>
          <HeaderLogoff />
        </header>

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
