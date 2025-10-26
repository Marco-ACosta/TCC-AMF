import { LocalStorage } from "@/storage/LocalStorage";
import Endpoints from "./base/Endpoints";

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
}
