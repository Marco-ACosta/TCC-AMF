"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Screen from "@/components/base/Screen";
import Box from "@/components/base/Box";
import { Alert, Button, Divider, Snackbar, Stack } from "@mui/material";
import UserService from "@/services/api/userService";

import ProfileHeader from "@/components/profile/ProfileHeader";
import UserInfoPanel from "@/components/profile/UserInfoPanel";
import RoleLanguagesPanel from "@/components/profile/RoleLanguagesPanel";
import {
  LoadingBlock,
  ErrorBlock,
  EmptyBlock,
} from "@/components/base/LoadState";

import { ProfileVM } from "@/types/profile";

export default function ProfilePage() {
  const router = useRouter();
  const search = useSearchParams();

  const [profile, setProfile] = useState<ProfileVM | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success_msg, set_success_msg] = useState<string | null>(null);

  useEffect(() => {
    if (search?.get("updated") === "1") {
      set_success_msg("Perfil atualizado com sucesso.");
    }
  }, [search]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await UserService.GetProfile();
        const raw: ProfileVM = (res?.Data as ProfileVM) ?? res;
        const vm: ProfileVM | null = raw?.user
          ? {
              user: {
                id: raw.user.id,
                name: raw.user.name,
                email: raw.user.email,
                created_at: raw.user.created_at,
                updated_at: raw.user.updated_at,
              },
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
              speaker: null,
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
          <ProfileHeader />

          {loading && <LoadingBlock />}
          {!!error && <ErrorBlock error={error} />}
          {!loading && !error && !hasProfile && (
            <EmptyBlock message="Nenhum perfil encontrado." />
          )}

          {!loading && !error && hasProfile && (
            <>
              <UserInfoPanel profile={profile} />

              <div>
                <Divider style={{ margin: "8px 0" }} />
                <RoleLanguagesPanel
                  title="Idiomas"
                  role={profile?.translator}
                />
              </div>

              <div>
                <Divider style={{ margin: "16px 0" }} />
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={2}
                  sx={{ mb: 1 }}>
                  <Button
                    variant="contained"
                    onClick={() => router.push("perfil/edit")}>
                    Editar
                  </Button>
                </Stack>
              </div>
            </>
          )}
        </div>
      </Box.Center>

      <Snackbar
        open={!!success_msg}
        autoHideDuration={3500}
        onClose={() => set_success_msg(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity="success" onClose={() => set_success_msg(null)}>
          {success_msg}
        </Alert>
      </Snackbar>
    </Screen>
  );
}
