import { Language } from "./language";

export type Translator = {
  id: number | string;
  languages: Language[];
};

export type Speaker = {
  id: number | string;
  bio?: string;
  languages: Language[];
};

export type UserItem = {
  id: number | string;
  name?: string;
  email?: string;
  is_admin: boolean;
  is_speaker: boolean;
  is_translator: boolean;
  translator: Translator | null;
  speaker: Speaker | null;
  created_at?: number;
  updated_at?: number;
};

export type UserTypeFilter = "all" | "translator" | "speaker" | "admin";

export type UserCreatePayload = {
  name: string;
  email: string;
  password: string;
  user_type: "speaker" | "translator" | "admin";
  languages?: number[];
  bio?: string | null;
};

export type UserUpdatePayload = {
  name?: string;
  email?: string;
  password?: string;
  languages?: number[];
  bio?: string | null;
};
