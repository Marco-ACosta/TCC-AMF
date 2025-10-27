"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Autocomplete,
  Chip,
} from "@mui/material";
import LanguageService from "@/services/api/languageService";
import { UserCreatePayload, UserItem, UserUpdatePayload } from "@/types/user";
import { Language } from "@/types/language";

type Mode = "create" | "edit";

type Props = {
  mode: Mode;
  initial?: Partial<UserItem>;
  onSubmit: (
    payload: UserCreatePayload | UserUpdatePayload
  ) => Promise<void> | void;
  submitting?: boolean;
  errorMsg?: string | null;
};

export default function UserForm({
  mode,
  initial,
  onSubmit,
  submitting,
  errorMsg,
}: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<"speaker" | "translator" | "admin">(
    initial?.is_admin
      ? "admin"
      : initial?.is_translator
      ? "translator"
      : initial?.is_speaker
      ? "speaker"
      : "admin"
  );
  const [bio, setBio] = useState<string>(initial?.speaker?.bio ?? "");
  const [languages, setLanguages] = useState<Language[]>(
    (initial?.translator?.languages ??
      initial?.speaker?.languages ??
      []) as Language[]
  );

  const [allLangs, setAllLangs] = useState<Language[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const showLangs = userType === "speaker" || userType === "translator";
  const showBio = userType === "speaker";

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await LanguageService.GetLanguages();
        const data = Array.isArray(res) ? res : res?.Data ?? [];
        if (!alive) return;
        const list: Language[] = (data as any[]).map((l) => ({
          id: l.id,
          code: l.code,
          name: l.name,
          created_at: l.created_at,
          updated_at: l.updated_at,
        }));
        setAllLangs(list);
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, []);

  function validate(): string | null {
    if (!name.trim()) return "Nome é obrigatório.";
    if (!email.trim()) return "Email é obrigatório.";

    if (mode === "create" && password.length < 8) {
      return "Senha deve ter no mínimo 8 caracteres.";
    }
    if (showLangs && languages.length === 0) {
      return "Selecione pelo menos um idioma.";
    }
    return null;
  }

  async function handleSubmit() {
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }
    setFormError(null);

    const languages_ids = showLangs
      ? languages.map((l) => Number(l.id)).filter((n) => !Number.isNaN(n))
      : [];

    if (mode === "create") {
      const payload: UserCreatePayload = {
        name: name.trim(),
        email: email.trim(),
        password,
        user_type: userType,
        languages: languages_ids,
        bio: showBio ? bio?.trim() || null : null,
      };
      await onSubmit(payload);
    } else {
      const payload: UserUpdatePayload = {
        name: name?.trim() || undefined,
        email: email?.trim() || undefined,
        password: password ? password : undefined,
        languages: showLangs ? languages_ids : undefined,
        bio: showBio ? bio?.trim() || null : undefined,
      };
      await onSubmit(payload);
    }
  }

  const disableUserType = mode === "edit";

  return (
    <Stack spacing={2}>
      {!!errorMsg && <Alert severity="error">{errorMsg}</Alert>}
      {!!formError && <Alert severity="warning">{formError}</Alert>}

      <TextField
        label="Nome"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={submitting}
        fullWidth
      />

      <TextField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={submitting}
        fullWidth
      />

      <TextField
        label={mode === "create" ? "Senha (mín. 8)" : "Nova senha (opcional)"}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={submitting}
        fullWidth
      />

      <FormControl fullWidth disabled={disableUserType || submitting}>
        <InputLabel id="user-type-label">Tipo de usuário</InputLabel>
        <Select
          labelId="user-type-label"
          label="Tipo de usuário"
          value={userType}
          onChange={(e) => setUserType(e.target.value as any)}>
          <MenuItem value="admin">Admin</MenuItem>
          <MenuItem value="translator">Tradutor</MenuItem>
          <MenuItem value="speaker">Palestrante</MenuItem>
        </Select>
        {disableUserType && (
          <FormHelperText>
            O tipo não pode ser alterado nesta edição.
          </FormHelperText>
        )}
      </FormControl>

      {showLangs && (
        <Autocomplete
          multiple
          options={allLangs}
          value={languages}
          onChange={(_, value) => setLanguages(value)}
          getOptionLabel={(o) => o.name || o.code || String(o.id)}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={String(option.id)}
                label={option.name ?? option.code ?? option.id}
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Idiomas"
              placeholder="Selecione idiomas"
            />
          )}
          disabled={submitting}
        />
      )}

      {showBio && (
        <TextField
          label="Bio (palestrante)"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          disabled={submitting}
          fullWidth
          multiline
          minRows={3}
        />
      )}

      <Stack direction="row" justifyContent="flex-end">
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}>
          {mode === "create" ? "Criar usuário" : "Salvar alterações"}
        </Button>
      </Stack>
    </Stack>
  );
}
