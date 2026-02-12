import { Request, Response } from "express";
import User from "../models/User";
import { handle } from "../lib/handle";
import { getCache, setCache, delCache } from "../lib/redis";
import * as profileService from "../services/profileService";

const CACHE_TTL = 300;
const cacheKey = (username: string) => `profile:${username}`;

const USERNAME_RE = /^[a-zA-Z0-9_-]{2,30}$/;

export const getProfile = handle<{ username: string }>(async (req, res) => {
  const user = await User.findOne({ username: req.params.username, isGuest: false });
  if (!user) return void res.status(404).json({ error: "User not found" });

  const year = parseInt(req.query.year as string) || new Date().getFullYear();

  const cached = await getCache(cacheKey(user.username) + `:${year}`);
  if (cached) return void res.json(JSON.parse(cached));

  const [heatmap, stats, badges, streaks] = await Promise.all([
    profileService.getHeatmap(user._id, year),
    profileService.getStats(user._id),
    profileService.computeBadges(user._id),
    profileService.computeStreaks(user._id),
  ]);

  const payload = {
    user: { username: user.username, userType: user.userType, createdAt: user.createdAt },
    stats,
    heatmap,
    badges,
    streaks,
  };

  await setCache(cacheKey(user.username) + `:${year}`, JSON.stringify(payload), CACHE_TTL);
  res.json(payload);
});

export const updateProfile = handle(async (req: Request, res: Response) => {
  const { username } = req.body;
  if (!username || !USERNAME_RE.test(username))
    return void res.status(400).json({ error: "Username must be 2-30 characters (letters, numbers, _ or -)" });

  const existing = await User.findOne({ username, _id: { $ne: req.userId } });
  if (existing) return void res.status(409).json({ error: "Username already taken" });

  const user = await User.findById(req.userId);
  if (!user) return void res.status(404).json({ error: "User not found" });

  const oldUsername = user.username;
  user.username = username;
  await user.save();

  await Promise.all([delCache(cacheKey(oldUsername)), delCache(cacheKey(username))]);
  res.json({ username });
});
