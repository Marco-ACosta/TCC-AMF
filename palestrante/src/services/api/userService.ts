import { LocalStorage } from "@/storage/LocalStorage";
import Endpoints from "./base/Endpoints";

export default class UserService extends Endpoints {
  static async GetProfile() {
    return await this.Get<any>({
      url: "user/profile",
      authorization: LocalStorage.apiToken.get() ?? "",
    });
  }
}
