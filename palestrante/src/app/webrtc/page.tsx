"use client";

import { useEffect, useRef } from "react";
import Box from "@/components/base/Box";
import Screen from "@/components/base/Screen";
import { WebRTCClient } from "@/services/webrtc";

export default function WebRTCPage() {
  const localRef = useRef<HTMLAudioElement>(null);
  const remoteRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const client = new WebRTCClient("default", true);
    client.start().then(({ localStream, remoteStream }) => {
      if (localRef.current) {
        localRef.current.srcObject = localStream;
        localRef.current.muted = true;
        localRef.current.play().catch(() => {});
      }
      if (remoteRef.current) {
        remoteRef.current.srcObject = remoteStream;
        remoteRef.current.play().catch(() => {});
      }
    });
  }, []);

  return (
    <Screen>
      <Box.Column>
        <h1>WebRTC - Palestrante</h1>
        <audio ref={localRef} />
        <audio ref={remoteRef} />
      </Box.Column>
    </Screen>
  );
}
