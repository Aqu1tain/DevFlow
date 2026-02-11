import Snippet from "../models/Snippet";

export const findPublicAndOwn = async (userId?: string, page = 1) => {
  const filter = userId
    ? { $or: [{ visibility: "public" }, { userId }] }
    : { visibility: "public" };
  const [data, total] = await Promise.all([
    Snippet.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .exec(),
    Snippet.countDocuments(filter),
  ]);
  return { data, total, pages: Math.ceil(total / PAGE_SIZE) };
};

const PAGE_SIZE = 50;

export const findAll = async (page: number) => {
  const [data, total] = await Promise.all([
    Snippet.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .populate("userId", "username")
      .exec(),
    Snippet.countDocuments(),
  ]);
  return { data, total, pages: Math.ceil(total / PAGE_SIZE) };
};

export const findById = (id: string) =>
  Snippet.findById(id).exec();

export const create = (data: Record<string, unknown>) =>
  Snippet.create(data);

export const update = (id: string, data: Record<string, unknown>) =>
  Snippet.findByIdAndUpdate(id, data, { new: true, runValidators: true }).exec();

export const remove = (id: string) =>
  Snippet.findByIdAndDelete(id).exec();

export const getStats = async () => {
  const [byVisibility, byLanguage] = await Promise.all([
    Snippet.aggregate<{ _id: string; count: number }>([{ $group: { _id: "$visibility", count: { $sum: 1 } } }]),
    Snippet.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$language", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
  ]);

  const vis = Object.fromEntries(byVisibility.map((v) => [v._id, v.count]));

  return {
    total: byVisibility.reduce((sum, v) => sum + v.count, 0),
    public: vis["public"] ?? 0,
    unlisted: vis["unlisted"] ?? 0,
    private: vis["private"] ?? 0,
    languages: byLanguage.map((l) => ({ name: l._id, count: l.count })),
  };
};
