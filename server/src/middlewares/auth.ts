import { Request, Response, NextFunction } from "express";
import User, { IUser } from "../models/User";
import { verifyToken, extractToken } from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      userId?: string;
      isGuest?: boolean;
    }
  }
}

type Middleware = (req: Request, res: Response, next: NextFunction) => void;

const attachUser = (req: Request, user: IUser) => {
  req.user = user;
  req.userId = String(user._id);
  req.isGuest = user.isGuest;
};

export const authenticate: Middleware = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return void res.status(401).json({ error: "Authentication required" });

  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.userId);
    if (!user) return void res.status(401).json({ error: "User not found" });
    if (user.isGuest && user.isGuestExpired()) return void res.status(401).json({ error: "Guest session expired" });

    attachUser(req, user);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

export const optionalAuth: Middleware = async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next();

  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.userId);
    if (user && (!user.isGuest || !user.isGuestExpired())) attachUser(req, user);
  } catch {
    // silent — continue without auth
  }

  next();
};

export const requireRegistered: Middleware = (req, res, next) => {
  if (req.isGuest) return void res.status(403).json({ error: "Registered account required" });
  next();
};

export const requirePro: Middleware = (req, res, next) => {
  if (req.isGuest) return void res.status(403).json({ error: "Registered account required" });
  if (req.user?.userType !== "pro") return void res.status(403).json({ error: "Pro subscription required" });
  next();
};

export const requireAdmin: Middleware = (req, res, next) => {
  if (req.user?.role !== "admin") return void res.status(403).json({ error: "Admin access required" });
  next();
};

export const requireAdminTotp: Middleware = (req, res, next) => {
  if (req.user?.role === "admin" && !req.user.totpEnabled)
    return void res.status(403).json({ error: "2FA required for admin access" });
  next();
};
