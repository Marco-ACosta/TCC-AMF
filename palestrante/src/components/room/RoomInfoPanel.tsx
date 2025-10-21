"use client";

import {
  Button,
  CircularProgress,
  Divider,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import InfoRow from "./InfoRow";
import { RoomDetails } from "@/types/room";

type Props = {
  loading?: boolean;
  error?: string | null;
  details?: RoomDetails | null;
  onCopyCode?: (code: string) => void;
};

export default function RoomInfoPanel({
  loading,
  error,
  details,
  onCopyCode,
}: Props) {
  return (
    <Paper
      variant="outlined"
      style={{
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}>
      <Typography variant="h6" sx={{ m: 0 }}>
        Informações da sala
      </Typography>
      <Divider />

      {loading && (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <CircularProgress size={18} />
          <span style={{ fontSize: 12, opacity: 0.8 }}>
            Carregando detalhes…
          </span>
        </div>
      )}

      {!!error && (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      )}

      {!loading && !error && (
        <>
          <InfoRow label="Nome" value={details?.name} />
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}>
            <InfoRow label="Código da sala" value={details?.code} />
            <Tooltip title="Copiar código">
              <span>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => details?.code && onCopyCode?.(details.code)}
                  disabled={!details?.code}>
                  Copiar
                </Button>
              </span>
            </Tooltip>
          </div>
          <div>
            <Typography variant="body2" sx={{ opacity: 0.7, mb: 0.5 }}>
              Descrição
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
              {details?.description || "Sem descrição."}
            </Typography>
          </div>
        </>
      )}
    </Paper>
  );
}
