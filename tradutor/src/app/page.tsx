"use client";

import Box from "@/components/base/Box";
import Screen from "@/components/base/Screen";
import { AuthContextProvider } from "@/contexts/AuthContext";
import { Button, Card, TextField } from "@mui/material";
import { useState } from "react";

export default function HomeScreen() {
  const { login } = AuthContextProvider();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  return (
    <Screen>
      <Box.Center style={{ width: "100vw", height: "100vh" }}>
        <Card
          style={{
            alignSelf: "center",
            justifySelf: "center",
            display: "flex",
            flexDirection: "column",
            padding: "1%",
          }}>
          {
            <form
              style={{
                display: "flex",
                flexDirection: "column",
              }}>
              <h1 style={{ width: "100%", textAlign: "center" }}>LOGIN</h1>
              <TextField
                label="Email"
                variant="outlined"
                style={{ margin: "5%" }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
              <TextField
                label="Senha"
                variant="outlined"
                style={{ margin: "5%" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoFocus
              />
              <Button
                variant="contained"
                color="primary"
                style={{ justifySelf: "center", alignSelf: "center" }}
                onClick={() => {
                  login({ email, password });
                }}>
                Login
              </Button>
            </form>
          }
        </Card>
      </Box.Center>
    </Screen>
  );
}
