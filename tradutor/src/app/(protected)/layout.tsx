import "../globals.css"
import Auth from "@/components/base/Auth"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Project Template Web - ADM",
  description: "Developed by Raisson",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: JSX.Element
}>) {
  return (
    <Auth>
      { children }
    </Auth>
  )
}