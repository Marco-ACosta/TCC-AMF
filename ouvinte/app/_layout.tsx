import GlobalProvider from "@/providers/GlobalProvider";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <GlobalProvider>
      <Stack />
    </GlobalProvider>
  );
}
