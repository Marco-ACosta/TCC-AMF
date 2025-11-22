import GlobalProvider from "@/providers/GlobalProvider";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { Stack } from "expo-router";
import { useEffect } from "react";

export default function RootLayout() {
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      interruptionModeIOS: InterruptionModeIOS.DuckOthers,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch(console.warn);
  }, []);

  return (
    <GlobalProvider>
      <Stack />
    </GlobalProvider>
  );
}
