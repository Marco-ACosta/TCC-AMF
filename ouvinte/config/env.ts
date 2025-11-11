type envProps = {
  ApiUrl: () => string;
  TurnUrl: () => string;
  TurnUser: () => string | undefined;
  TurnPassword: () => string | undefined;
  Environment: () => "testing" | "production";
};

const env: envProps = {
  ApiUrl: () => {
    const _ = String(process.env["EXPO_PUBLIC_API_URL"]);
    if (_ === "" || _ === "undefined") {
      console.error("API_URL não encontrado no ENV.");
      throw new Error("API_URL não encontrado no ENV.");
    }
    return _;
  },
  TurnUrl: () => {
    const _ = String(process.env["EXPO_PUBLIC_TUNR_URL"]);
    if (_ === "" || _ === "undefined") {
      console.error("TUNR_URL não encontrado no ENV.");
      throw new Error("TUNR_URL não encontrado no ENV.");
    }
    return _;
  },
  TurnUser: () => {
    const _ = String(process.env["EXPO_PUBLIC_TURN_USER"]);
    return _;
  },
  TurnPassword: () => {
    const _ = String(process.env["EXPO_PUBLIC_TURN_PASSWORD"]);
    return _;
  },
  Environment: () => {
    const _ = String(process.env["EXPO_PUBLIC_ENV"]);
    return _ === undefined ||
      _ === null ||
      _ === "undefined" ||
      _ === "null" ||
      _ === "testing"
      ? "testing"
      : "production";
  },
};

export default env;
