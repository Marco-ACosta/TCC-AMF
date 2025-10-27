import { LocalStorage } from "@/storage/LocalStorage";
import Endpoints from "./base/Endpoints";

export default class LanguageService extends Endpoints {
  static async GetLanguages() {
    return await this.Get<any>({
      url: "language",
      authorization: LocalStorage.apiToken.get() ?? "",
    });
  }

  static async GetLanguage(id: string) {
    return await this.Get<any>({
      url: `language/${id}`,
      authorization: LocalStorage.apiToken.get() ?? "",
    });
  }
}
