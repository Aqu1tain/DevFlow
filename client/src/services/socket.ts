import { io, type Socket } from "socket.io-client";
import { getToken } from "./api";

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const SOCKET_URL = API_BASE.replace(/\/api$/, "");

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token: getToken() },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
  });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
