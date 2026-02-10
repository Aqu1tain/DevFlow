import type { Socket } from "socket.io";
import { verifyToken } from "../utils/jwt";
import User from "../models/User";

export interface SocketData {
  userId: string;
  username: string;
}

export async function socketAuth(socket: Socket, next: (err?: Error) => void) {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication required"));

  try {
    const { userId } = verifyToken(token);
    const user = await User.findById(userId);
    if (!user) return next(new Error("User not found"));
    if (user.isGuest && user.isGuestExpired()) return next(new Error("Guest session expired"));

    socket.data = { userId: user._id.toString(), username: user.username };
    next();
  } catch {
    next(new Error("Invalid token"));
  }
}
