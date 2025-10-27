"use client";

import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Stack,
  Chip,
  Button,
  Divider,
} from "@mui/material";
import RoleChips from "./RoleChips";
import { UserItem } from "@/types/user";

type Props = {
  user: UserItem;
  onEdit?: (u: UserItem) => void;
  onDelete?: (u: UserItem) => void;
};

export default function UserCard({ user, onEdit, onDelete }: Props) {
  const translatorLangs = user.translator?.languages ?? [];
  const speakerLangs = user.speaker?.languages ?? [];

  return (
    <li style={{ margin: 0, padding: 0, width: "100%" }}>
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack spacing={1}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center">
              <Typography variant="h6">{user.name ?? "Sem nome"}</Typography>
              <RoleChips
                is_admin={user.is_admin}
                is_translator={user.is_translator}
                is_speaker={user.is_speaker}
              />
            </Stack>

            {user.email && (
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
            )}

            {(translatorLangs.length > 0 || speakerLangs.length > 0) && (
              <Divider sx={{ my: 1 }} />
            )}

            {translatorLangs.length > 0 && (
              <Stack spacing={0.5}>
                <Typography variant="subtitle2">Idiomas:</Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {translatorLangs.map((l) => (
                    <Chip
                      key={`t-${l.id}`}
                      size="small"
                      label={l.name ?? l.code ?? l.id}
                    />
                  ))}
                </Stack>
              </Stack>
            )}

            {speakerLangs.length > 0 && (
              <Stack spacing={0.5} sx={{ mt: translatorLangs.length ? 1 : 0 }}>
                <Typography variant="subtitle2">Idiomas:</Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {speakerLangs.map((l) => (
                    <Chip
                      key={`s-${l.id}`}
                      size="small"
                      label={l.name ?? l.code ?? l.id}
                    />
                  ))}
                </Stack>
              </Stack>
            )}
          </Stack>
        </CardContent>

        <CardActions sx={{ justifyContent: "flex-end", px: 2, pb: 2 }}>
          {onEdit && (
            <Button size="small" onClick={() => onEdit(user)}>
              Editar
            </Button>
          )}
          {onDelete && (
            <Button size="small" color="error" onClick={() => onDelete(user)}>
              Excluir
            </Button>
          )}
        </CardActions>
      </Card>
    </li>
  );
}
