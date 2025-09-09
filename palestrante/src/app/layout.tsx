import "./globals.css";
import AuthContextComponent from "@/contexts/AuthContext";
import InitialContextComponent from "@/contexts/InitialContexts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Project Palestrante",
  description: "Developed by Raisson",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: JSX.Element;
}>) {
  return (
    <html lang="pt-br">
      <body>
        <InitialContextComponent>
          <AuthContextComponent>{children}</AuthContextComponent>
        </InitialContextComponent>
      </body>
    </html>
  );
}
