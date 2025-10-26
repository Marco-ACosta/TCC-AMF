export default abstract class Base64 {
    static decode(base64? : string) {
        return atob(base64 ?? "MA==")
    }

    static encode(str? : string) {
        return btoa(str ?? "MA==")
    }
}