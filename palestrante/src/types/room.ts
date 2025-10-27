import { Language } from "./language";

export type Speaker = {
  user_id: number | string;
  name: string;
  bio?: string | null;
  languages: Language[];
};

export type LangPair = { source: Language; target: Language };

export type Translator = {
  user_id: number | string;
  name: string;
  pairs: LangPair[];
};

export type RoomDetails = {
  id: string;
  code: string;
  name: string;
  description: string;
  speakers: Speaker[];
  translators: Translator[];
};

export type RoomItem = {
  id: string | number;
  name: string;
  code?: string;
  description?: string;
};

export type IceServer = {
  urls: string | string[];
  username?: string;
  credential?: string;
};

export type MemberMeta = {
  id: string | number;
  sid?: string;
  role?: "translator" | "speaker" | "admin" | "user" | "relay";
  pairs?: Array<{ source?: { code?: string }; target?: { code?: string } }>;
  src?: string;
  tgt?: string;
};

export type OfferPayload = {
  from: string | number;
  sdp: string;
  type: RTCSdpType;
  meta?: MemberMeta;
};

export type RoomInfoPayload = {
  members?: MemberMeta[];
  details?: RoomDetails;
  room?: string;
};

export type RxStats = {
  bytesReceived: number;
  packetsReceived: number;
  totalSamplesReceived?: number;
  audioLevel?: number;
  jitter?: number;
  packetsLost?: number;
  timestamp?: number;
};

export type TxStats = {
  bytesSent: number;
  packetsSent: number;
  totalSamplesSent?: number;
  audioLevel?: number;
  timestamp?: number;
};

export type SimpleUser = {
  id: number | string;
  name: string;
  languages: Language[];
};

export type TranslatorRow = {
  user_id?: number | string;
  from_language_code?: string;
  to_language_code?: string;
  from_language_id?: number | string;
  to_language_id?: number | string;
  _error?: string | null;
};

export type SpeakerRow = {
  user_id?: number | string;
  language_id?: number | string;
  _error?: string | null;
};
