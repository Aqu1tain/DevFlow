import Snippet, { ISnippet } from "../models/Snippet";

export const findAll = (): Promise<ISnippet[]> => {
  return Snippet.find().sort({ createdAt: -1 }).exec();
};

export const findById = (id: string): Promise<ISnippet | null> => {
  return Snippet.findById(id).exec();
};

export const create = (
  data: Partial<ISnippet>
): Promise<ISnippet> => {
  return Snippet.create(data);
};

export const update = (
  id: string,
  data: Partial<ISnippet>
): Promise<ISnippet | null> => {
  return Snippet.findByIdAndUpdate(id, data, { new: true }).exec();
};

export const remove = (id: string): Promise<ISnippet | null> => {
  return Snippet.findByIdAndDelete(id).exec();
};
