import Snippet, { ISnippet } from "../models/Snippet";

export const findAll = () =>
  Snippet.find().sort({ createdAt: -1 }).exec();

export const findById = (id: string) =>
  Snippet.findById(id).exec();

export const create = (data: Partial<ISnippet>) =>
  Snippet.create(data);

export const update = (id: string, data: Partial<ISnippet>) =>
  Snippet.findByIdAndUpdate(id, data, { new: true }).exec();

export const remove = (id: string) =>
  Snippet.findByIdAndDelete(id).exec();
