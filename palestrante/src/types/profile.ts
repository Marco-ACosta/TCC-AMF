export type Language = { id: number | string; code?: string; name?: string };

export type RoleProfile = {
  id?: number | string;
  languages?: Language[];
} | null;

export type ProfileVM = {
  id?: number | string;
  name?: string;
  email?: string;
  created_at?: number;
  updated_at?: number;
  translator: RoleProfile;
  speaker: RoleProfile;
};
