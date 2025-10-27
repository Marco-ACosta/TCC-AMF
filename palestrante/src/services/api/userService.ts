import { LocalStorage } from "@/storage/LocalStorage";
import Endpoints from "./base/Endpoints";
import { UserCreatePayload } from "@/types/user";

export default class UserService extends Endpoints {
  static async GetProfile() {
    return await this.Get<any>({
      url: "user/profile",
      authorization: LocalStorage.apiToken.get() ?? "",
    });
  }

  static async UpdateSelf(input: any) {
    const data: Record<string, any> = {};

    if (typeof input.name === "string") {
      const v = input.name.trim();
      if (v) data.name = v;
    }

    if (typeof input.email === "string") {
      const v = input.email.trim();
      if (v) data.email = v;
    }

    if (typeof input.password === "string") {
      const v = input.password.trim();
      if (v) data.password = v;
    }

    if (typeof input.bio === "string") {
      const v = input.bio.trim();
      data.bio = v ? v : null;
    } else if (input.bio === null) {
      data.bio = null;
    }

    if (Object.prototype.hasOwnProperty.call(input, "languages")) {
      const v = (input as Required<any>).languages;
      if (Array.isArray(v)) {
        data.languages = Array.from(
          new Set(v.map((id) => Number(id)).filter((n) => Number.isFinite(n)))
        );
      } else {
        data.languages = v;
      }
    }

    return await this.Put<any>({
      url: "user/profile",
      body: data,
      authorization: LocalStorage.apiToken.get() ?? "",
    });
  }

  static async GetUsers(type?: string) {
    return await this.Get<any>({
      url: `user${type ? "?type=" + type : ""}`,
      authorization: LocalStorage.apiToken.get() ?? "",
    });
  }

  static async DeleteUser(id: number) {
    return await this.Get<any>({
      url: `user/${id}}`,
      authorization: LocalStorage.apiToken.get() ?? "",
    });
  }

  static async CreateUser(payload: UserCreatePayload) {
    return await this.Post<any>({
      url: "user",
      authorization: LocalStorage.apiToken.get() ?? "",
      body: payload,
    });
  }

  static async UpdateUser(input: any, id: string) {
    const data: Record<string, any> = {};

    if (typeof input.name === "string") {
      const v = input.name.trim();
      if (v) data.name = v;
    }

    if (typeof input.email === "string") {
      const v = input.email.trim();
      if (v) data.email = v;
    }

    if (typeof input.password === "string") {
      const v = input.password.trim();
      if (v) data.password = v;
    }

    if (typeof input.bio === "string") {
      const v = input.bio.trim();
      data.bio = v ? v : null;
    } else if (input.bio === null) {
      data.bio = null;
    }

    if (Object.prototype.hasOwnProperty.call(input, "languages")) {
      const v = (input as Required<any>).languages;
      if (Array.isArray(v)) {
        data.languages = Array.from(
          new Set(v.map((id) => Number(id)).filter((n) => Number.isFinite(n)))
        );
      } else {
        data.languages = v;
      }
    }

    return await this.Put<any>({
      url: `user/${id}`,
      body: data,
      authorization: LocalStorage.apiToken.get() ?? "",
    });
  }
}
