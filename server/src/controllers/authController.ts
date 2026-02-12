import crypto from "crypto";
import { Request, Response } from "express";
import * as totp from "../utils/totp";
import User, { IUser } from "../models/User";
import { generateToken, generateTempToken, verifyTempToken } from "../utils/jwt";

interface GitHubTokenResponse {
  access_token?: string;
  error?: string;
}

interface GitHubUser {
  id: number;
  login: string;
  email?: string;
}

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

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
  totpEnabled: user.totpEnabled,
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

  const user = await User.findOne({ email: email.toLowerCase(), isGuest: false }).select("+password +totpSecret");
  if (!user || !(await user.comparePassword(password))) throw fail("Invalid credentials", 401);

  if (user.totpEnabled) {
    return void res.json({ requireTotp: true, tempToken: generateTempToken(String(user._id)) });
  }

  user.lastLoginAt = new Date();
  await user.save();

  res.json(authResponse(user));
});

export const verifyTotp = handle(async (req, res) => {
  const { tempToken, code } = req.body;
  if (!tempToken || !code) throw fail("Missing token or code");

  let payload: { userId: string; pendingTotp: boolean };
  try {
    payload = verifyTempToken(tempToken);
  } catch {
    throw fail("Session expired, please log in again", 401);
  }

  if (!payload.pendingTotp) throw fail("Invalid token", 401);

  const user = await User.findById(payload.userId).select("+totpSecret");
  if (!user || !user.totpEnabled || !user.totpSecret) throw fail("2FA not configured", 401);

  if (!totp.verify(code.replace(/\s/g, ""), user.totpSecret))
    throw fail("Invalid code", 401);

  user.lastLoginAt = new Date();
  await user.save();

  res.json(authResponse(user));
});

export const setupTotp = handle(async (req, res) => {
  const user = req.user!;
  const secret = totp.generateSecret();
  const uri = totp.keyuri(user.email || user.username, "DevFlow", secret);
  res.json({ secret, uri });
});

export const enableTotp = handle(async (req, res) => {
  const { secret, code } = req.body;
  if (!secret || !code) throw fail("Missing secret or code");

  if (!totp.verify(code.replace(/\s/g, ""), secret))
    throw fail("Invalid code", 400);

  const user = await User.findById(req.userId).select("+totpSecret");
  if (!user) throw fail("User not found", 404);

  user.totpSecret = secret;
  user.totpEnabled = true;
  await user.save();

  res.json({ message: "2FA enabled" });
});

export const disableTotp = handle(async (req, res) => {
  const { code } = req.body;
  if (!code) throw fail("Missing code");

  const user = await User.findById(req.userId).select("+totpSecret");
  if (!user?.totpEnabled || !user.totpSecret) throw fail("2FA is not enabled");

  if (!totp.verify(code.replace(/\s/g, ""), user.totpSecret))
    throw fail("Invalid code", 401);

  user.totpSecret = undefined;
  user.totpEnabled = false;
  await user.save();

  res.json({ message: "2FA disabled" });
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

const GITHUB = {
  authorize: "https://github.com/login/oauth/authorize",
  token: "https://github.com/login/oauth/access_token",
  user: "https://api.github.com/user",
  emails: "https://api.github.com/user/emails",
};

const STATE_TTL = 10 * 60 * 1000;
const HMAC_SECRET = process.env.JWT_SECRET || "change_me_in_production";

const hmac = (data: string) =>
  crypto.createHmac("sha256", HMAC_SECRET).update(data).digest("hex").slice(0, 16);

const signState = () => {
  const ts = Date.now().toString();
  return `${ts}.${hmac(ts)}`;
};

const verifyState = (state: string) => {
  const [ts, sig] = state.split(".");
  if (!ts || !sig || sig !== hmac(ts)) return false;
  return Date.now() - parseInt(ts) < STATE_TTL;
};

const serverUrl = () =>
  process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;

const clientUrl = () =>
  process.env.CLIENT_URL || "http://localhost:5173";

export const githubRedirect = (_req: Request, res: Response) => {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: `${serverUrl()}/api/auth/github/callback`,
    scope: "user:email",
    state: signState(),
  });
  res.redirect(`${GITHUB.authorize}?${params}`);
};

const getGitHubAccessToken = async (code: string): Promise<string> => {
  const res = await fetch(GITHUB.token, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const data = await res.json() as GitHubTokenResponse;
  if (!data.access_token) throw new Error("Failed to get GitHub access token");
  return data.access_token;
};

const githubHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "User-Agent": "DevFlow",
});

const getPrimaryEmail = (emails: GitHubEmail[]): string | null => {
  if (!Array.isArray(emails)) return null;
  return emails.find((e) => e.primary && e.verified)?.email ?? null;
};

const getGitHubUser = async (accessToken: string): Promise<{ githubUser: GitHubUser; email: string | null }> => {
  const headers = githubHeaders(accessToken);
  const [userRes, emailsRes] = await Promise.all([fetch(GITHUB.user, { headers }), fetch(GITHUB.emails, { headers })]);

  const githubUser = await userRes.json() as GitHubUser;
  const emails = await emailsRes.json() as GitHubEmail[];
  const email = githubUser.email ?? getPrimaryEmail(emails);

  return { githubUser, email };
};

const uniqueUsername = async (base: string): Promise<string> => {
  const taken = await User.exists({ username: base });
  if (!taken) return base;
  return `${base}_${Date.now().toString(36).slice(-4)}`;
};

const findOrCreateGitHubUser = async (githubUser: GitHubUser, email: string | null): Promise<IUser> => {
  const ghId = String(githubUser.id);
  let user = await User.findOne({ githubId: ghId });

  if (!user && email) {
    user = await User.findOne({ email: email.toLowerCase(), isGuest: false });
  }

  if (user) {
    if (!user.githubId) user.githubId = ghId;
    user.lastLoginAt = new Date();
    await user.save();
    return user;
  }

  return User.create({
    githubId: ghId,
    email: email?.toLowerCase(),
    username: await uniqueUsername(githubUser.login),
    userType: "free",
  });
};

export const githubCallback = async (req: Request, res: Response) => {
  const failUrl = `${clientUrl()}/login?error=github_auth_failed`;

  const { code, state } = req.query;
  if (typeof code !== "string" || typeof state !== "string" || !verifyState(state)) {
    return res.redirect(failUrl);
  }

  try {
    const accessToken = await getGitHubAccessToken(code);
    const { githubUser, email } = await getGitHubUser(accessToken);
    const user = await findOrCreateGitHubUser(githubUser, email);
    const token = generateToken(user);
    res.redirect(`${clientUrl()}/auth/callback?token=${token}`);
  } catch {
    res.redirect(failUrl);
  }
};
