"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Stack,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
  Link,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

import { RoomItem } from "@/types/room";
import RoomService from "@/services/api/roomService";

type Props = {
  room: RoomItem;
  type?: "admin" | "palestrante" | "tradutor" | string;
  onOpen?: (room: RoomItem) => void;
  onEdit?: (room: RoomItem) => void;
  onDelete?: (room: RoomItem) => void;
};

export default function RoomCard({
  room,
  type,
  onOpen,
  onEdit,
  onDelete,
}: Props) {
  const router = useRouter();
  const [menuEl, setMenuEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuEl);
  const code = useMemo(() => String(room.code ?? "").trim(), [room.code]);
  const idNum = useMemo(() => {
    const n = Number(String(room.id));
    return Number.isFinite(n) ? n : null;
  }, [room.id]);

  function openMenu(e: React.MouseEvent<HTMLElement>) {
    setMenuEl(e.currentTarget);
  }
  function closeMenu() {
    setMenuEl(null);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
    } finally {
      closeMenu();
    }
  }

  function handleOpen() {
    if (onOpen) return onOpen(room);
    if (!code) return;
    router.push(`/${type}/${encodeURIComponent(code)}`);
  }

  function handleEdit() {
    if (onEdit) return onEdit(room);
    if (!code) return;
    router.push(`/${type}/${encodeURIComponent(code)}/edit`);
  }

  async function handleDelete() {
    if (onDelete) {
      closeMenu();
      return onDelete(room);
    }
    if (!idNum) return;
    const ok = window.confirm(
      `Excluir a sala "${room.name}"? Esta ação não pode ser desfeita.`
    );
    if (!ok) return;
    try {
      await RoomService.DeleteRoom(idNum);
    } catch {
    } finally {
      closeMenu();
    }
  }

  const href = room.code ? `/${type}/${encodeURIComponent(room.code)}` : "";

  return (
    <li style={{ margin: 0, padding: 0, width: "100%" }}>
      <Link
        href={href}
        style={{ display: "block", textDecoration: "none", color: "inherit" }}
        aria-label={`Abrir sala ${room.name ?? room.code}`}>
        <Card variant="outlined" sx={{ width: "100%" }}>
          <CardContent>
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              gap={1}>
              <Stack spacing={0.5} flex={1} minWidth={0}>
                <Typography variant="h6" noWrap title={room.name}>
                  {room.name}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  noWrap
                  title={code}>
                  Código: <strong>{code || "—"}</strong>
                </Typography>
                {room.description && (
                  <Typography
                    variant="body2"
                    sx={{ mt: 0.5 }}
                    color="text.secondary"
                    noWrap>
                    {room.description}
                  </Typography>
                )}
              </Stack>

              <Tooltip title="Mais ações">
                <IconButton aria-label="mais ações" onClick={openMenu}>
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={menuEl}
                open={menuOpen}
                onClose={closeMenu}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}>
                <MenuItem onClick={handleCopy} disabled={!code}>
                  <ContentCopyIcon
                    fontSize="small"
                    style={{ marginRight: 8 }}
                  />
                  Copiar código
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleOpen} disabled={!code}>
                  <OpenInNewIcon fontSize="small" style={{ marginRight: 8 }} />
                  Abrir
                </MenuItem>
                {type === "admin" && (
                  <>
                    <MenuItem onClick={handleEdit} disabled={!code}>
                      <EditIcon fontSize="small" style={{ marginRight: 8 }} />
                      Editar
                    </MenuItem>
                    <MenuItem onClick={handleDelete} disabled={!idNum}>
                      <DeleteIcon fontSize="small" style={{ marginRight: 8 }} />
                      Excluir
                    </MenuItem>
                  </>
                )}
              </Menu>
            </Stack>
          </CardContent>
          <CardActions sx={{ justifyContent: "flex-end", px: 2, pb: 2 }}>
            <Button size="small" onClick={handleOpen}>
              Abrir
            </Button>
            {type === "admin" && (
              <Button size="small" onClick={handleEdit}>
                Editar
              </Button>
            )}
            {type === "admin" && (
              <Button size="small" color="error" onClick={handleDelete}>
                Excluir
              </Button>
            )}
          </CardActions>
        </Card>
      </Link>
    </li>
  );
}
