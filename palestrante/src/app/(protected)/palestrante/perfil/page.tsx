"use client";

import { useEffect, useState } from "react";
import Screen from "@/components/base/Screen";
import Box from "@/components/base/Box";
import { Divider } from "@mui/material";
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

export default function ProfilePage() {
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
        const raw: ApiResponse = (res?.Data as ApiResponse) ?? res;

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
                  title="Palestrante"
                  role={profile?.speaker}
                />
              </div>
            </>
          )}
        </div>
      </Box.Center>
    </Screen>
  );
}
