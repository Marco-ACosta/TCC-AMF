"use client";

import Box from "@/components/base/Box";
import Screen from "@/components/base/Screen";
import { AuthContextProvider } from "@/contexts/AuthContext";
import { Alert, Button, Card, TextField } from "@mui/material";
import { useState } from "react";

export default function HomeScreen() {
  const { login } = AuthContextProvider();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      await login({ email, password });
    } catch (err: any) {
      setErrorMsg(
        err?.message || "Falha ao entrar. Verifique e tente novamente."
      );
    }
  };

  const hasError = !!errorMsg;

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
            minWidth: 360,
          }}>
          <form
            onSubmit={handleSubmit}
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
              error={hasError}
              autoFocus
            />

            <TextField
              label="Senha"
              variant="outlined"
              style={{ margin: "5%" }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              error={hasError}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              style={{ justifySelf: "center", alignSelf: "center" }}>
              Login
            </Button>
          </form>

          {hasError && (
            <Alert severity="error" style={{ marginTop: 12 }}>
              {errorMsg}
            </Alert>
          )}
        </Card>
      </Box.Center>
    </Screen>
  );
}
