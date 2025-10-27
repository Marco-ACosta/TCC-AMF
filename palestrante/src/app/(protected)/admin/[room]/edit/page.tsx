"use client";

import Screen from "@/components/base/Screen";
import Box from "@/components/base/Box";
import EditRoomForm from "@/components/room/EditRoomForm";

export default function EditRoomPage({ params }: { params: { room: string } }) {
  return (
    <Screen>
      <Box.Center style={{ width: "100%" }}>
        <EditRoomForm code={params.room} />
      </Box.Center>
    </Screen>
  );
}
