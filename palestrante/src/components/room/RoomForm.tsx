"use client";

import { useEffect, useState } from "react";
import { Button, Stack, TextField, Typography } from "@mui/material";
import TranslatorsSection from "./TranslatorsSection";
import SpeakersSection from "./SpeakersSection";
import { SimpleUser, SpeakerRow, TranslatorRow } from "@/types/room";

export default function RoomForm({
  mode,
  initial,
  translatorUsers,
  speakerUsers,
  onCancel,
  onSubmit,
  loading,
  saving,
}: {
  mode: "create" | "edit";
  initial?: {
    name?: string;
    description?: string | null;
    translators?: TranslatorRow[];
    speakers?: SpeakerRow[];
  };
  translatorUsers: SimpleUser[];
  speakerUsers: SimpleUser[];
  onCancel: () => void;
  onSubmit: (payload: {
    name: string;
    description: string | null;
    translators?: {
      user_id: number;
      from_language_id: number;
      to_language_id: number;
    }[];
    speakers?: { user_id: number; language_id: number }[];
  }) => void | Promise<void>;
  loading?: boolean;
  saving?: boolean;
}) {
  console.log("translatorUsers", translatorUsers);
  console.log("speakerUsers", speakerUsers);
  console.log("initial", initial);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState<string>(
    initial?.description ?? ""
  );
  const [tRows, setTRows] = useState<TranslatorRow[]>(
    initial?.translators ?? []
  );
  const [sRows, setSRows] = useState<SpeakerRow[]>(initial?.speakers ?? []);

  useEffect(() => {
    if (!initial) return;
    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");
    setTRows(initial?.translators ?? []);
    setSRows(initial?.speakers ?? []);
  }, [initial]);

  function validate(): boolean {
    let ok = true;

    setTRows((prev) =>
      prev.map((r) => {
        const tu = translatorUsers.find(
          (u) => String(u.id) === String(r.user_id ?? "")
        );
        const ids = new Set((tu?.languages ?? []).map((l) => String(l.id)));
        let err: string | null = null;
        if (!r.user_id || !r.from_language_id || !r.to_language_id) {
          err = "Selecione o usuário e os idiomas de origem e destino.";
          ok = false;
        } else if (String(r.from_language_id) === String(r.to_language_id)) {
          err = "Origem e destino devem ser diferentes.";
          ok = false;
        } else if (
          !ids.has(String(r.from_language_id)) ||
          !ids.has(String(r.to_language_id))
        ) {
          err = "Idiomas devem pertencer ao tradutor selecionado.";
          ok = false;
        }
        return { ...r, _error: err };
      })
    );

    setSRows((prev) =>
      prev.map((r) => {
        const su = speakerUsers.find(
          (u) => String(u.id) === String(r.user_id ?? "")
        );
        const ids = new Set(
          (su?.languages ?? []).map((l) => {
            return String(l.id);
          })
        );
        let err: string | null = null;
        if (!r.user_id || !r.language_id) {
          err = "Selecione o usuário e o idioma.";
          ok = false;
        } else if (!ids.has(String(r.language_id))) {
          err = "O idioma deve pertencer ao palestrante selecionado.";
          ok = false;
        }
        return { ...r, _error: err };
      })
    );

    return ok;
  }

  function addTranslator() {
    setTRows((prev) => [
      ...prev,
      {
        user_id: undefined,
        from_language_id: undefined,
        to_language_id: undefined,
        from_language_code: undefined,
        to_language_code: undefined,
        _error: null,
      },
    ]);
  }
  function removeTranslator(idx: number) {
    setTRows((prev) => prev.filter((_, i) => i !== idx));
  }
  function patchTranslator(idx: number, patch: Partial<TranslatorRow>) {
    setTRows((prev) => {
      const next = [...prev];
      const row = { ...next[idx], ...patch } as TranslatorRow;
      if (patch.user_id !== undefined) {
        row.from_language_id = undefined;
        row.to_language_id = undefined;
      }
      next[idx] = { ...row, _error: null };
      return next;
    });
  }

  function addSpeaker() {
    setSRows((prev) => [
      ...prev,
      { user_id: undefined, language_id: undefined, _error: null },
    ]);
  }
  function removeSpeaker(idx: number) {
    setSRows((prev) => prev.filter((_, i) => i !== idx));
  }
  function patchSpeaker(idx: number, patch: Partial<SpeakerRow>) {
    setSRows((prev) => {
      const next = [...prev];
      const row = { ...next[idx], ...patch } as SpeakerRow;
      if (patch.user_id !== undefined) {
        row.language_id = undefined;
      }
      next[idx] = { ...row, _error: null };
      return next;
    });
  }

  async function handleSubmit() {
    if (!name.trim()) return;
    if (!validate()) return;

    const translators =
      tRows.length > 0
        ? tRows.map((r) => ({
            user_id: Number(r.user_id),
            from_language_id: Number(r.from_language_id),
            to_language_id: Number(r.to_language_id),
          }))
        : undefined;

    const speakers =
      sRows.length > 0
        ? sRows.map((r) => ({
            user_id: Number(r.user_id),
            language_id: Number(r.language_id),
          }))
        : undefined;

    await onSubmit({
      name: name.trim(),
      description: (description ?? "").trim(),
      translators,
      speakers,
    });
  }
  const disabled = Boolean(loading);

  return (
    <div style={{ width: "100%", maxWidth: 880, padding: 16 }}>
      <Typography variant="h5" gutterBottom>
        {mode === "edit" ? "Editar sala" : "Nova sala"}
      </Typography>

      <Stack spacing={2}>
        <TextField
          label="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          fullWidth
          disabled={disabled}
        />
        <TextField
          label="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          minRows={2}
          disabled={disabled}
        />

        <TranslatorsSection
          users={translatorUsers}
          rows={tRows}
          onAdd={addTranslator}
          onRemove={removeTranslator}
          onPatch={patchTranslator}
          disabled={disabled}
        />

        <SpeakersSection
          users={speakerUsers}
          rows={sRows}
          onAdd={addSpeaker}
          onRemove={removeSpeaker}
          onPatch={patchSpeaker}
          disabled={disabled}
        />

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving || !name.trim()}>
            Salvar
          </Button>
        </Stack>
      </Stack>
    </div>
  );
}
