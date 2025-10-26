import io, { Socket } from "socket.io-client";

type SignalingOptions = {
  path?: string;
  transports?: ("websocket" | "polling")[];
  withCredentials?: boolean;
};

export function createSignalingClient(
  baseURL: string,
  opts: SignalingOptions = {}
): Socket {
  const {
    path = "/signal",
    transports = ["websocket", "polling"],
    withCredentials = false,
  } = opts;

  return io(baseURL, {
    path,
    transports,
    withCredentials,
  });
}
