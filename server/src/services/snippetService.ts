import Snippet, { ISnippet } from "../models/Snippet";

export const findPublicAndOwn = (userId?: string) => {
  const filter = userId
    ? { $or: [{ visibility: "public" }, { userId }] }
    : { visibility: "public" };
  return Snippet.find(filter).sort({ createdAt: -1 }).exec();
};

export const findById = (id: string) =>
  Snippet.findById(id).exec();

export const create = (data: Partial<ISnippet>) =>
  Snippet.create(data);

export const update = (id: string, data: Partial<ISnippet>) =>
  Snippet.findByIdAndUpdate(id, data, { new: true, runValidators: true }).exec();

export const remove = (id: string) =>
  Snippet.findByIdAndDelete(id).exec();
