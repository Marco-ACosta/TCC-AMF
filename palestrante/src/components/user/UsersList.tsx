"use client";

import { Grid } from "@mui/material";
import UserCard from "./UserCard";
import { UserItem } from "@/types/user";

type Props = {
  users: UserItem[];
  onOpen?: (u: UserItem) => void;
  onEdit?: (u: UserItem) => void;
  onDelete?: (u: UserItem) => void;
};

export default function UsersList({ users, onOpen, onEdit, onDelete }: Props) {
  return (
    <ul style={{ listStyle: "none", padding: 0, width: "100%" }}>
      {users.map((u) => (
        <UserCard user={u} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </ul>
  );
}
