import "../globals.css";
import Auth from "@/components/base/Auth";
import type { Metadata } from "next";

export const metadata: Metadata = {};

export default function RootLayout({
  children,
}: Readonly<{
  children: JSX.Element;
}>) {
  return <Auth>{children}</Auth>;
}
