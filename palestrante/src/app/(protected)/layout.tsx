import "../globals.css";
import type { Metadata } from "next";
import ClientShell from "./ClientShell";

export const metadata: Metadata = {
  title: "Tradutor AMF",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <ClientShell>{children}</ClientShell>;
}
