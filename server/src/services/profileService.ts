import { Types } from "mongoose";
import Snippet from "../models/Snippet";
import Comment from "../models/Comment";
import Snapshot from "../models/Snapshot";

type DateCounts = Record<string, number>;

const dateAgg = (model: typeof Snippet | typeof Comment | typeof Snapshot, userId: Types.ObjectId, start: Date, end: Date) =>
  model.aggregate([
    { $match: { userId, createdAt: { $gte: start, $lt: end } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
  ]);

export async function getHeatmap(userId: Types.ObjectId, year: number): Promise<DateCounts> {
  const start = new Date(`${year}-01-01T00:00:00Z`);
  const end = new Date(`${year + 1}-01-01T00:00:00Z`);

  const [snippets, comments, snapshots] = await Promise.all([
    dateAgg(Snippet, userId, start, end),
    dateAgg(Comment, userId, start, end),
    dateAgg(Snapshot, userId, start, end),
  ]);

  const merged: DateCounts = {};
  for (const group of [...snippets, ...comments, ...snapshots]) {
    merged[group._id] = (merged[group._id] || 0) + group.count;
  }
  return merged;
}

export async function getStats(userId: Types.ObjectId) {
  const [snippets, comments, snapshots, languages] = await Promise.all([
    Snippet.countDocuments({ userId }),
    Comment.countDocuments({ userId }),
    Snapshot.countDocuments({ userId }),
    Snippet.distinct("language", { userId }),
  ]);
  return { snippets, comments, snapshots, languages };
}

async function getUniqueDates(userId: Types.ObjectId) {
  const agg = (model: typeof Snippet | typeof Comment | typeof Snapshot) =>
    model.aggregate([
      { $match: { userId } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } } },
    ]);

  const [s, c, sn] = await Promise.all([agg(Snippet), agg(Comment), agg(Snapshot)]);
  const set = new Set<string>();
  for (const g of [...s, ...c, ...sn]) set.add(g._id);
  return [...set].sort();
}

export async function computeStreaks(userId: Types.ObjectId) {
  const dates = await getUniqueDates(userId);
  if (!dates.length) return { current: 0, longest: 0 };

  let longest = 1;
  let streak = 1;

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86_400_000;
    if (diff === 1) {
      streak++;
      if (streak > longest) longest = streak;
    } else {
      streak = 1;
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const last = dates[dates.length - 1];

  let current = 0;
  if (last === today || last === yesterday) {
    current = 1;
    for (let i = dates.length - 2; i >= 0; i--) {
      const prev = new Date(dates[i]);
      const curr = new Date(dates[i + 1]);
      if ((curr.getTime() - prev.getTime()) / 86_400_000 === 1) current++;
      else break;
    }
  }

  return { current, longest };
}

interface Badge {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  progress?: { current: number; target: number };
}

export async function computeBadges(userId: Types.ObjectId): Promise<Badge[]> {
  const [stats, streaks, nightOwl, earlyBird] = await Promise.all([
    getStats(userId),
    computeStreaks(userId),
    Snippet.exists({
      userId,
      $expr: { $and: [{ $gte: [{ $hour: "$createdAt" }, 0] }, { $lt: [{ $hour: "$createdAt" }, 5] }] },
    }),
    Snippet.exists({
      userId,
      $expr: { $and: [{ $gte: [{ $hour: "$createdAt" }, 5] }, { $lt: [{ $hour: "$createdAt" }, 8] }] },
    }),
  ]);

  const p = (current: number, target: number) => ({ current: Math.min(current, target), target });

  return [
    { id: "first-snippet", name: "first snippet", description: "Create your first snippet", unlocked: stats.snippets >= 1, progress: p(stats.snippets, 1) },
    { id: "prolific", name: "prolific", description: "Create 10 snippets", unlocked: stats.snippets >= 10, progress: p(stats.snippets, 10) },
    { id: "centurion", name: "centurion", description: "Create 100 snippets", unlocked: stats.snippets >= 100, progress: p(stats.snippets, 100) },
    { id: "commentator", name: "commentator", description: "Write 10 comments", unlocked: stats.comments >= 10, progress: p(stats.comments, 10) },
    { id: "night-owl", name: "night owl", description: "Create a snippet between midnight and 5 AM", unlocked: !!nightOwl },
    { id: "early-bird", name: "early bird", description: "Create a snippet between 5 AM and 8 AM", unlocked: !!earlyBird },
    { id: "polyglot", name: "polyglot", description: "Use 5 or more languages", unlocked: stats.languages.length >= 5, progress: p(stats.languages.length, 5) },
    { id: "streak-master", name: "streak master", description: "Maintain a 7-day streak", unlocked: streaks.longest >= 7, progress: p(streaks.longest, 7) },
    { id: "marathon", name: "marathon", description: "Maintain a 30-day streak", unlocked: streaks.longest >= 30, progress: p(streaks.longest, 30) },
  ];
}
