"use client";

import Box from "@/components/base/Box";
import Screen from "@/components/base/Screen";

export default function AdminScreen() {
  return (
    <Screen>
      <Box.Center
        style={{
          alignContent: "center",
          justifyContent: "center",
          width: "100vw",
          height: "100vh",
        }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            height: "100%",
            width: "100%",
          }}>
          <h1>Seção</h1>
        </div>
      </Box.Center>
    </Screen>
  );
}
