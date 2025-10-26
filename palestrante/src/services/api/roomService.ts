import { LocalStorage } from "@/storage/LocalStorage";
import Endpoints from "./base/Endpoints";
import { RoomDetails } from "@/types/room";

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

  static async getRoomDetails(room_code: string): Promise<RoomDetails | null> {
    const res = await RoomService.GetRoom(room_code);
    const raw = (res as any)?.Data ?? res;
    if (!raw) return null;
    return RoomService.mapRawRoomDetails(raw, room_code);
  }

  static mapRawRoomDetails(raw: any, fallbackCode: string): RoomDetails {
    return {
      id: String(raw?.id ?? fallbackCode),
      code: String(raw?.code ?? fallbackCode),
      name: String(raw?.name ?? ""),
      description: String(raw?.description ?? ""),
      speakers: Array.isArray(raw?.speakers)
        ? raw.speakers.map((s: any) => ({
            id: s?.user_id ?? s?.id ?? String(s?.name ?? "speaker"),
            name: String(s?.name ?? ""),
            bio: s?.bio ?? null,
            languages: Array.isArray(s?.languages)
              ? s.languages.map((l: any) => ({
                  id: l?.id ?? l?.code ?? String(l?.name ?? "lang"),
                  code: l?.code,
                  name: l?.name,
                }))
              : [],
          }))
        : [],
      translators: Array.isArray(raw?.translators)
        ? raw.translators.map((t: any) => ({
            id: t?.user_id ?? t?.id ?? String(t?.name ?? "translator"),
            name: String(t?.name ?? ""),
            pairs: Array.isArray(t?.pairs)
              ? t.pairs.map((p: any) => ({
                  source: {
                    id:
                      p?.source?.id ??
                      p?.source?.code ??
                      String(p?.source?.name ?? "source"),
                    code: p?.source?.code,
                    name: p?.source?.name,
                  },
                  target: {
                    id:
                      p?.target?.id ??
                      p?.target?.code ??
                      String(p?.target?.name ?? "target"),
                    code: p?.target?.code,
                    name: p?.target?.name,
                  },
                }))
              : [],
          }))
        : [],
    };
  }
}
