import Endpoints from "./base/Endpoints";

export default abstract class RoomService extends Endpoints {
  static async GetByCode(code: string) {
    return await this.Get<any>({
      url: `/room/${code}`,
    });
  }
}
