import { Request, Response } from "express";
import User, { IUser } from "../models/User";
import { generateToken } from "../utils/jwt";

type Handler = (req: Request, res: Response) => Promise<void>;

const handle =
  (fn: Handler): Handler =>
  async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      const status = (err as { status?: number }).status || 500;
      const message = err instanceof Error ? err.message : "Internal server error";
      res.status(status).json({ error: message });
    }
  };

const fail = (message: string, status = 400) =>
  Object.assign(new Error(message), { status });

const sanitize = (user: IUser) => ({
  id: user._id,
  email: user.email,
  username: user.username,
  userType: user.userType,
  role: user.role,
  isGuest: user.isGuest,
  guestExpiresAt: user.isGuest ? user.guestExpiresAt : undefined,
});

const authResponse = (user: IUser) => ({
  token: generateToken(user),
  user: sanitize(user),
});

export const register = handle(async (req, res) => {
  const { email, password, username } = req.body;
  if (!email || !password) throw fail("Email and password required");

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw fail("Email already in use", 409);

  const user = await User.create({
    email: email.toLowerCase(),
    password,
    username: username || `user_${Date.now()}`,
    userType: "free",
  });

  res.status(201).json(authResponse(user));
});

export const login = handle(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw fail("Email and password required");

  const user = await User.findOne({ email: email.toLowerCase(), isGuest: false }).select("+password");
  if (!user || !(await user.comparePassword(password))) throw fail("Invalid credentials", 401);

  user.lastLoginAt = new Date();
  await user.save();

  res.json(authResponse(user));
});

export const createGuest = handle(async (_req, res) => {
  res.status(201).json(authResponse(await User.createGuest()));
});

export const convertGuest = handle(async (req, res) => {
  if (!req.isGuest) throw fail("Only guest accounts can be converted");

  const { email, password, username } = req.body;
  if (!email || !password) throw fail("Email and password required");

  const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: req.userId } });
  if (existing) throw fail("Email already in use", 409);

  const user = req.user!;
  user.email = email.toLowerCase();
  user.password = password;
  if (username) user.username = username;
  user.userType = "free";
  user.isGuest = false;
  user.guestSessionId = undefined;
  user.guestExpiresAt = undefined;
  await user.save();

  res.json(authResponse(user));
});

export const me = handle(async (req, res) => {
  res.json({ user: sanitize(req.user!) });
});
