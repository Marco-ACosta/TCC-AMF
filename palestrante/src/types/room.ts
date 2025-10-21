export type Language = { id: number | string; code?: string; name?: string };

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
  role?: "translator" | "speaker" | "admin" | "user";
  pairs?: Array<{ source?: { code?: string }; target?: { code?: string } }>;
  src?: string;
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
