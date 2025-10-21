import { Stack } from "expo-router"
import GlobalProvider from "@/providers/GlobalProvider"

export default function RootLayout() {
  return (
    <GlobalProvider>
      <Stack />
    </GlobalProvider>
  )
}
