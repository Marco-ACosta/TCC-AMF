type envProps = {
  BackendUrl: () => string;
  Environment: () => "testing" | "production";
  SignalingURL: () => string;
};

/** Buscador de variáveis de ambiente */
const env: envProps = {
  BackendUrl: () => {
    const _ = String(process.env["NEXT_PUBLIC_BACKEND_URL"]);
    if (_ === "" || _ === "undefined") {
      console.error("NEXT_PUBLIC_BACKEND_URL não encontrado no ENV.");
      throw new Error("NEXT_PUBLIC_BACKEND_URL não encontrado no ENV.");
    }
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
  SignalingURL: () => {
    const _ = String(process.env["NEXT_PUBLIC_SIGNALING_URL"]);
    if (_ === "" || _ === "undefined") {
      throw new Error("NEXT_PUBLIC_SIGNALING_URL não encontrado no ENV.");
    }
    return _;
  },
};

export default env;
