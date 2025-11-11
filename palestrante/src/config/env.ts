type envProps = {
  BackendUrl: () => string;
  TurnUrl: () => string;
  TurnUser: () => string | undefined;
  TurnPassword: () => string | undefined;
  Environment: () => "testing" | "production";
};

const env: envProps = {
  BackendUrl: () => {
    const _ = String(process.env["NEXT_PUBLIC_BACKEND_URL"]);
    if (_ === "" || _ === "undefined") {
      console.error("NEXT_PUBLIC_BACKEND_URL não encontrado no ENV.");
      throw new Error("NEXT_PUBLIC_BACKEND_URL não encontrado no ENV.");
    }
    return _;
  },
  TurnUrl: () => {
    const _ = String(process.env["NEXT_PUBLIC_TUNR_URL"]);
    if (_ === "" || _ === "undefined") {
      console.error("NEXT_PUBLIC_TUNR_URL não encontrado no ENV.");
      throw new Error("NEXT_PUBLIC_TUNR_URL não encontrado no ENV.");
    }
    return _;
  },
  TurnUser: () => {
    const _ = String(process.env["NEXT_PUBLIC_TUNR_USER"]);
    return _;
  },
  TurnPassword: () => {
    const _ = String(process.env["NEXT_PUBLIC_TUNR_PASSWORD"]);

    return _;
  },
  Environment: () => {
    const _ = String(process.env["NEXT_PUBLIC_APP_ENV"]);
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
