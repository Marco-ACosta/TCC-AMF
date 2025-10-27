"use client";

import Screen from "@/components/base/Screen";
import Box from "@/components/base/Box";
import NewRoomForm from "@/components/room/NewRoomForm";

export default function NewRoomPage() {
  return (
    <Screen>
      <Box.Center style={{ width: "100%" }}>
        <NewRoomForm />
      </Box.Center>
    </Screen>
  );
}
