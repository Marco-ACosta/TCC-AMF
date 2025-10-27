import { LocalStorage } from "@/storage/LocalStorage";
import Endpoints from "./base/Endpoints";

export type TranslatorItem = {
  user_id: number | string;
  from_language_id: number | string;
  to_language_id: number | string;
};

export type SpeakerItem = {
  user_id: number | string;
  language_id: number | string;
};

export type RoomCreatePayload = {
  name: string;
  description?: string | null;
  translators?: TranslatorItem[] | null;
  speakers?: SpeakerItem[] | null;
};

export type RoomUpdatePayload = {
  name?: string;
  description?: string | null;
  translators?: TranslatorItem[] | null;
  speakers?: SpeakerItem[] | null;
};

export default class RoomService extends Endpoints {
  static async GetRooms() {
    return await this.Get<any>({
      url: "room",
      authorization: LocalStorage.apiToken.get() ?? "",
    });
  }

  static async GetRoom(code: string) {
    return await this.Get<any>({
      url: `room/${code}`,
      authorization: LocalStorage.apiToken.get() ?? "",
    });
  }

  static async CreateRoom(payload: RoomCreatePayload) {
    return await this.Post<any>({
      url: "room/",
      body: payload,
      authorization: LocalStorage.apiToken.get() ?? "",
    });
  }

  static async UpdateRoom(id: number | string, payload: RoomUpdatePayload) {
    return await this.Put<any>({
      url: `room/${id}`,
      body: payload,
      authorization: LocalStorage.apiToken.get() ?? "",
    });
  }

  static async DeleteRoom(id: number | string) {
    return await this.Delete<void>({
      url: `room/${id}`,
      authorization: LocalStorage.apiToken.get() ?? "",
    });
  }
}
