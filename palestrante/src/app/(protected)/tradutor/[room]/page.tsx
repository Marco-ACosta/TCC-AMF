"use client";

import Screen from "@/components/base/Screen";
import Box from "@/components/base/Box";
import RoomInfoPanel from "@/components/room/RoomInfoPanel";
import SpeakersPanel from "@/components/room/SpeakersPanel";
import TranslatorsPanel from "@/components/room/TranslatorsPanel";
import RoomHeader from "@/components/room/RoomHeader";
import { useRoomDetails } from "@/hooks/useRoomDetails";
import { copyToClipboard } from "@/utils/copyToClipboard";

export default function RoomDetailsPage({
  params,
}: {
  params: { room: string };
}) {
  const room = params.room;

  const {
    details,
    loading: detailsLoading,
    error: detailsError,
    reload,
  } = useRoomDetails(room);

  return (
    <Screen>
      <Box.Center
        style={{
          alignContent: "center",
          justifyContent: "center",
          height: "100%",
          width: "100%",
        }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 16,
            width: "100%",
            maxWidth: 980,
            margin: "0 auto",
            padding: 16,
          }}>
          <RoomHeader
            room_code={room}
            details={details}
            on_copy_code={(code) => copyToClipboard(code)}
            on_reload={reload}
            role="tradutor"
          />

          <RoomInfoPanel
            loading={detailsLoading}
            error={detailsError}
            details={details}
            onCopyCode={copyToClipboard}
          />

          <SpeakersPanel
            loading={detailsLoading}
            speakers={details?.speakers}
          />

          <TranslatorsPanel
            loading={detailsLoading}
            translators={details?.translators}
          />
        </div>
      </Box.Center>
    </Screen>
  );
}
