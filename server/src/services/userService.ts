import User from "../models/User";

export const getStats = async () => {
  const byType = await User.aggregate<{ _id: string; count: number }>([
    { $match: { isGuest: false } },
    { $group: { _id: "$userType", count: { $sum: 1 } } },
  ]);

  const types = Object.fromEntries(byType.map((t) => [t._id, t.count]));

  return {
    total: byType.reduce((sum, t) => sum + t.count, 0),
    free: types["free"] ?? 0,
    pro: types["pro"] ?? 0,
  };
};
