import { Request, Response } from "express";
import User, { IUser } from "../models/User";
import { generateToken } from "../utils/jwt";

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

const GITHUB_OAUTH_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";
const GITHUB_EMAILS_URL = "https://api.github.com/user/emails";

export const githubRedirect = (_req: Request, res: Response) => {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: `${process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`}/api/auth/github/callback`,
    scope: "user:email",
  });
  res.redirect(`${GITHUB_OAUTH_URL}?${params}`);
};

const getGitHubAccessToken = async (code: string): Promise<string> => {
  const res = await fetch(GITHUB_TOKEN_URL, {
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

const getGitHubUser = async (accessToken: string): Promise<{ githubUser: GitHubUser; email: string | null }> => {
  const headers = { Authorization: `Bearer ${accessToken}`, "User-Agent": "DevFlow" };

  const [userRes, emailsRes] = await Promise.all([
    fetch(GITHUB_USER_URL, { headers }),
    fetch(GITHUB_EMAILS_URL, { headers }),
  ]);

  const githubUser = await userRes.json() as GitHubUser;
  const emails = await emailsRes.json() as GitHubEmail[];

  const primary = Array.isArray(emails) ? emails.find((e) => e.primary && e.verified) : null;
  const email = githubUser.email || primary?.email || null;

  return { githubUser, email };
};

const findOrCreateGitHubUser = async (githubUser: GitHubUser, email: string | null): Promise<IUser> => {
  let user = await User.findOne({ githubId: String(githubUser.id) });

  if (!user && email) {
    user = await User.findOne({ email: email.toLowerCase(), isGuest: false });
  }

  if (user) {
    if (!user.githubId) user.githubId = String(githubUser.id);
    user.lastLoginAt = new Date();
    await user.save();
    return user;
  }

  return User.create({
    githubId: String(githubUser.id),
    email: email?.toLowerCase(),
    username: githubUser.login,
    userType: "free",
  });
};

export const githubCallback = async (req: Request, res: Response) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  try {
    const code = req.query.code as string;
    if (!code) throw new Error("No code provided");

    const accessToken = await getGitHubAccessToken(code);
    const { githubUser, email } = await getGitHubUser(accessToken);
    const user = await findOrCreateGitHubUser(githubUser, email);
    const token = generateToken(user);

    res.redirect(`${clientUrl}/auth/callback?token=${token}`);
  } catch {
    res.redirect(`${clientUrl}/login?error=github_auth_failed`);
  }
};
