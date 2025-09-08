import "../globals.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Project Template Web - EXTERNAL",
  description: "Developed by Raisson",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: JSX.Element
}>) {
  return children
}