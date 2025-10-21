import Endpoints from "./base/Endpoints";

export default class AuthService extends Endpoints {
  static async Login(body: { email: string; password: string }) {
    return await this.Post<any>({
      url: "user/login",
      body: body,
    });
  }
}
