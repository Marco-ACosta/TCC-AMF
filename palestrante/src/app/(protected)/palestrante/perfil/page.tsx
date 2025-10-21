"use client";

import UserService from "@/services/api/userService";
import { useEffect, useState } from "react";
import Box from "@/components/base/Box";
import Screen from "@/components/base/Screen";
import { Chip, CircularProgress, Divider, TextField } from "@mui/material";

type ApiLanguage = {
  id: number | string;
  code?: string;
  name?: string;
  created_at?: number;
  updated_at?: number;
};

type ApiRole = {
  id: number | string;
  user_id?: number | string;
  created_at?: number;
  updated_at?: number;
  languages?: ApiLanguage[];
} | null;

type ApiResponse = {
  user: {
    id: number | string;
    name?: string;
    email?: string;
    created_at?: number;
    updated_at?: number;
  };
  translator: ApiRole;
  speaker: ApiRole;
};

type Language = { id: number | string; code?: string; name?: string };
type RoleProfile = { id?: number | string; languages?: Language[] } | null;

type ProfileVM = {
  id?: number | string;
  name?: string;
  email?: string;
  created_at?: number;
  updated_at?: number;
  translator: RoleProfile;
  speaker: RoleProfile;
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<ProfileVM | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await UserService.GetProfile();
        const raw: ApiResponse = res?.Data as ApiResponse;

        const vm: ProfileVM | null = raw?.user
          ? {
              id: raw.user.id,
              name: raw.user.name,
              email: raw.user.email,
              created_at: raw.user.created_at,
              updated_at: raw.user.updated_at,
              translator: raw?.translator
                ? {
                    id: raw.translator.id,
                    languages:
                      raw.translator.languages?.map((l) => ({
                        id: l.id,
                        code: l.code,
                        name: l.name,
                      })) ?? [],
                  }
                : null,
              speaker: raw?.speaker
                ? {
                    id: raw.speaker.id,
                    languages:
                      raw.speaker.languages?.map((l) => ({
                        id: l.id,
                        code: l.code,
                        name: l.name,
                      })) ?? [],
                  }
                : null,
            }
          : null;

        if (!alive) return;
        setProfile(vm);
      } catch (e: any) {
        if (!alive) return;
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "Falha ao carregar perfil.";
        setError(msg);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const formatEpoch = (ts?: number) => {
    if (!ts && ts !== 0) return "";
    const n = Number(ts);
    if (Number.isNaN(n)) return "";
    const ms = String(n).length <= 10 ? n * 1000 : n; // aceita seconds ou ms
    try {
      return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Sao_Paulo",
      }).format(new Date(ms));
    } catch {
      return "";
    }
  };

  const renderLanguages = (langs?: Language[]) => {
    if (!langs || langs.length === 0)
      return <span style={{ opacity: 0.7 }}>Sem idiomas.</span>;
    return (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {langs.map((l) => (
          <Chip
            key={String(l.id)}
            label={[l.name].filter(Boolean).join(" — ")}
            variant="outlined"
            size="small"
          />
        ))}
      </div>
    );
  };

  const hasProfile = !!profile;

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
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            height: "100%",
            width: "100%",
            maxWidth: 720,
            margin: "0 auto",
            padding: 16,
            gap: 12,
          }}>
          <h1 style={{ textAlign: "center", marginBottom: 8 }}>Perfil</h1>

          {loading && (
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
              }}>
              <CircularProgress size={22} />
              <span>Carregando…</span>
            </div>
          )}

          {!!error && (
            <p style={{ color: "red", marginTop: 8, textAlign: "center" }}>
              {error}
            </p>
          )}

          {!loading && !error && !hasProfile && (
            <p style={{ opacity: 0.8, textAlign: "center" }}>
              Nenhum perfil encontrado.
            </p>
          )}

          {!loading && !error && hasProfile && (
            <>
              <TextField
                label="Nome"
                variant="outlined"
                value={profile?.name ?? ""}
                onChange={() => {}}
                fullWidth
                disabled
              />

              <TextField
                label="E-mail"
                variant="outlined"
                value={profile?.email ?? ""}
                onChange={() => {}}
                fullWidth
                disabled
              />

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <TextField
                  label="Criado em"
                  variant="outlined"
                  value={formatEpoch(profile?.created_at)}
                  onChange={() => {}}
                  disabled
                  style={{ flex: 1, minWidth: 220 }}
                />
                <TextField
                  label="Atualizado em"
                  variant="outlined"
                  value={formatEpoch(profile?.updated_at)}
                  onChange={() => {}}
                  disabled
                  style={{ flex: 1, minWidth: 220 }}
                />
              </div>

              <Divider style={{ margin: "8px 0" }} />

              <h3 style={{ margin: "8px 0 4px" }}>Tradutor</h3>
              {profile?.translator ? (
                renderLanguages(profile.translator.languages)
              ) : (
                <span style={{ opacity: 0.7 }}>Sem perfil de tradutor.</span>
              )}

              <h3 style={{ margin: "16px 0 4px" }}>Palestrante</h3>
              {profile?.speaker ? (
                renderLanguages(profile.speaker.languages)
              ) : (
                <span style={{ opacity: 0.7 }}>Sem perfil de palestrante.</span>
              )}
            </>
          )}
        </div>
      </Box.Center>
    </Screen>
  );
}
