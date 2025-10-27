import { Language } from "./language";

export type RoleProfile = {
  id?: number | string;
  languages?: Language[];
  bio?: string;
} | null;

export type UserProfile = {
  id?: number | string;
  name?: string;
  email?: string;
  created_at?: number;
  updated_at?: number;
};

export type ProfileVM = {
  user: UserProfile;
  translator: RoleProfile;
  speaker: RoleProfile;
};
