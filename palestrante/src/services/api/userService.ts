import { LocalStorage } from "@/storage/LocalStorage";
import Endpoints from "./base/Endpoints";

export default class UserService extends Endpoints {
  static async GetProfile() {
    console.log(LocalStorage.apiToken.get());
    return await this.Get<any>({
      url: "user/profile",
      authorization: LocalStorage.apiToken.get() ?? "",
    });
  }
}
