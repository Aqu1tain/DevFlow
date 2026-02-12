import jwt, { type SignOptions } from "jsonwebtoken";
import type { Request } from "express";
import type { IUser } from "../models/User";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET)
  throw new Error("JWT_SECRET environment variable is required");

const SECRET = process.env.JWT_SECRET ?? "dev_secret";

const ISSUER = "devflow";
const EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"];
const GUEST_EXPIRES_IN = "24h" as SignOptions["expiresIn"];

export interface TokenPayload {
  userId: string;
  userType: string;
  role: string;
  isGuest: boolean;
}

export const generateToken = (user: IUser): string => {
  const payload = { userId: user._id, userType: user.userType, role: user.role, isGuest: user.isGuest };
  const opts: SignOptions = { expiresIn: user.isGuest ? GUEST_EXPIRES_IN : EXPIRES_IN, issuer: ISSUER };
  return jwt.sign(payload, SECRET, opts);
};

export const verifyToken = (token: string): TokenPayload =>
  jwt.verify(token, SECRET, { issuer: ISSUER }) as TokenPayload;

export interface TempTokenPayload {
  userId: string;
  pendingTotp: true;
}

export const generateTempToken = (userId: string): string =>
  jwt.sign({ userId, pendingTotp: true }, SECRET, { expiresIn: "5m", issuer: ISSUER });

export const verifyTempToken = (token: string): TempTokenPayload =>
  jwt.verify(token, SECRET, { issuer: ISSUER }) as TempTokenPayload;

export const extractToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" && token ? token : null;
};
