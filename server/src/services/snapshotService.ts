import Snapshot from "../models/Snapshot";

export const findBySnippetId = (snippetId: string) =>
  Snapshot.find({ snippetId }).sort({ createdAt: -1 }).lean().exec();

export const findById = (id: string) =>
  Snapshot.findById(id).exec();

export const create = (data: {
  snippetId: string;
  userId: string;
  name: string;
  title: string;
  language: string;
  description: string;
  code: string;
  tags: string[];
}) => Snapshot.create(data);

export const remove = (id: string) =>
  Snapshot.findByIdAndDelete(id).exec();

export const removeBySnippetId = (snippetId: string) =>
  Snapshot.deleteMany({ snippetId }).exec();
