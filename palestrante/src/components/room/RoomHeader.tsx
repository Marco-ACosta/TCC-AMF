"use client";

import Link from "next/link";
import { Button, IconButton, Tooltip } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RefreshIcon from "@mui/icons-material/Refresh";
import { RoomDetails } from "@/types/room";

type Props = {
  room_code: string;
  details: RoomDetails | null;
  on_copy_code?: (code: string) => void;
  on_reload?: () => void;
  role: string;
};

export default function RoomHeader({
  room_code,
  details,
  on_copy_code,
  on_reload,
  role,
}: Props) {
  const code = details?.code ?? room_code;
  const name = details?.name ?? "Sala";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}>
      <div>
        <h2 style={{ margin: 0 }}>{name}</h2>
        <div
          style={{
            opacity: 0.7,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
          <span>
            Código: <strong>{code}</strong>
          </span>

          {on_copy_code && (
            <Tooltip title="Copiar código">
              <IconButton
                size="small"
                aria-label="copiar código da sala"
                onClick={() => on_copy_code(code)}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {on_reload && (
            <Tooltip title="Recarregar informações">
              <IconButton
                size="small"
                aria-label="recarregar detalhes da sala"
                onClick={() => on_reload()}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </div>
      </div>

      <Link
        href={`/${role}/${encodeURIComponent(room_code)}/transmicao`}
        prefetch>
        <Button
          variant="outlined"
          size="small"
          style={{
            padding: "10px 16px",
            borderRadius: 12,
            background: "transparent",
            cursor: "pointer",
          }}
          title="Entrar na chamada">
          Entrar na chamada
        </Button>
      </Link>
    </div>
  );
}
