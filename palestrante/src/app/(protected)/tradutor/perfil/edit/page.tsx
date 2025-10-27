"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Screen from "@/components/base/Screen";
import Box from "@/components/base/Box";
import { Alert, Divider, Snackbar, Stack, Typography } from "@mui/material";

import UserService from "@/services/api/userService";
import LanguageService from "@/services/api/languageService";

import {
  LoadingBlock,
  ErrorBlock,
  EmptyBlock,
} from "@/components/base/LoadState";

import { Language, ProfileVM } from "@/types/profile";

import SaveCancelBar from "@/components/profile/SaveCancelBar";
import UserBasicsForm from "@/components/profile/UserBasicsForm";
import PasswordChangeForm from "@/components/profile/PasswordChangeForm";
import LanguagesMultiSelect from "@/components/profile/LanguagesMultiSelect";

function trim_or_none(v?: string | null): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}
function ensure_length(
  v: string | null,
  min?: number,
  max?: number
): string | null {
  if (v === null) return null;
  const len = v.length;
  if (min && len < min) throw new Error(`Mínimo de ${min} caracteres`);
  if (max && len > max) throw new Error(`Máximo de ${max} caracteres`);
  return v;
}

export default function EditProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileVM | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success_msg, set_success_msg] = useState<string | null>(null);

  const [name, set_name] = useState<string>("");
  const [email, set_email] = useState<string>("");

  const [password, set_password] = useState<string>("");
  const [confirm_password, set_confirm_password] = useState<string>("");

  const [languages_options, set_languages_options] = useState<Language[]>([]);
  const [languages_loading, set_languages_loading] = useState(false);
  const [languages_ids, set_languages_ids] = useState<number[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setPageError(null);

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

        set_name(raw?.user?.name ?? "");
        set_email(raw?.user?.email ?? "");

        const union_ids = new Set<number>();
        raw?.translator?.languages?.forEach((l) => union_ids.add(Number(l.id)));
        set_languages_ids(Array.from(union_ids));
      } catch (e: any) {
        if (!alive) return;
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "Falha ao carregar perfil.";
        setPageError(msg);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        set_languages_loading(true);
        const res = await LanguageService.GetLanguages?.();
        const data: Language[] = (res?.Data as Language[]) ?? res ?? [];
        if (!alive) return;
        set_languages_options(data);
      } catch {
      } finally {
        if (alive) set_languages_loading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const hasProfile = !!profile;

  async function handle_save() {
    try {
      setSaving(true);
      setError(null);

      const payload: Record<string, any> = {};

      const name_norm = ensure_length(trim_or_none(name), 1, 120);
      if (name_norm !== null) payload.name = name_norm;

      const email_norm = ensure_length(trim_or_none(email), undefined, 320);
      if (email_norm !== null) payload.email = email_norm;

      const pwd_norm = trim_or_none(password);
      if (pwd_norm !== null) {
        ensure_length(pwd_norm, 8, 120);
        if (pwd_norm !== confirm_password) {
          throw new Error("A confirmação de senha não confere.");
        }
        payload.password = pwd_norm;
      }

      if (languages_ids && languages_ids.length) {
        payload.languages = languages_ids.map((id) => Number(id));
      }

      const keys = Object.keys(payload);
      if (!keys.length) {
        set_success_msg("Nada para atualizar.");
        router.push("/tradutor/perfil?updated=1");
        return;
      }

      await UserService.UpdateSelf(payload);

      set_success_msg("Perfil atualizado com sucesso.");
      router.push("/tradutor/perfil?updated=1");
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Falha ao atualizar o perfil.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

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
          <Typography variant="h5">Editar perfil</Typography>

          {loading && <LoadingBlock />}
          {!!pageError && <ErrorBlock error={pageError} />}
          {!loading && !pageError && !hasProfile && (
            <EmptyBlock message="Nenhum perfil encontrado." />
          )}

          {!loading && !pageError && hasProfile && (
            <>
              <Stack spacing={2}>
                <UserBasicsForm
                  name={name}
                  email={email}
                  disabled={saving}
                  onChangeName={set_name}
                  onChangeEmail={set_email}
                />

                <Divider />
                <Typography variant="subtitle1">Alterar senha</Typography>
                <PasswordChangeForm
                  password={password}
                  confirmPassword={confirm_password}
                  onChangePassword={set_password}
                  onChangeConfirmPassword={set_confirm_password}
                  disabled={saving}
                />

                <Divider />
                <Typography variant="subtitle1">Idiomas</Typography>
                <LanguagesMultiSelect
                  options={languages_options}
                  loading={languages_loading}
                  selectedIds={languages_ids}
                  onChangeSelectedIds={set_languages_ids}
                  disabled={saving}
                />

                {!!error && <Alert severity="error">{error}</Alert>}

                <SaveCancelBar
                  saving={saving}
                  onCancel={() => router.back()}
                  onSave={handle_save}
                  align="end"
                />
              </Stack>
            </>
          )}
        </div>
      </Box.Center>

      <Snackbar
        open={!!success_msg}
        autoHideDuration={2500}
        onClose={() => set_success_msg(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity="success" onClose={() => set_success_msg(null)}>
          {success_msg}
        </Alert>
      </Snackbar>
    </Screen>
  );
}
