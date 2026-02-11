import { Request } from "express";
import * as snippetService from "../services/snippetService";
import * as commentService from "../services/commentService";
import * as snapshotService from "../services/snapshotService";
import { handle } from "../lib/handle";

type Params = { id: string };

export const getAll = handle<Params>(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  res.json(await snippetService.findPublicAndOwn(req.userId, page));
});

export const getById = handle<Params>(async (req, res) => {
  res.json(req.snippet);
});

const pick = <T extends Record<string, unknown>>(obj: T, keys: string[]) =>
  Object.fromEntries(keys.filter((k) => k in obj).map((k) => [k, obj[k]]));

const EDITABLE_FIELDS = ["title", "language", "description", "code", "tags"];

const canUsePrivate = (req: Request) =>
  req.user?.userType === "pro" || req.user?.role === "admin";

export const create = handle<Params>(async (req, res) => {
  const data = pick(req.body, [...EDITABLE_FIELDS, "visibility"]);
  if (data.visibility === "private" && !canUsePrivate(req)) {
    return void res.status(402).json({ error: "Private snippets require a Pro account" });
  }
  res.status(201).json(await snippetService.create({ ...data, userId: req.userId }));
});

export const update = handle<Params>(async (req, res) => {
  const snippet = req.snippet!;
  if (snippet.visibility !== "public" && !req.isOwner) {
    return void res.status(403).json({ error: "Access denied" });
  }

  const data = pick(req.body, EDITABLE_FIELDS);
  const wantsPrivate = req.body.visibility === "private";
  if (req.isOwner && "visibility" in req.body) data.visibility = req.body.visibility;
  if (wantsPrivate && !canUsePrivate(req)) {
    return void res.status(402).json({ error: "Private snippets require a Pro account" });
  }

  const updated = await snippetService.update(req.params.id, data);
  if (!updated) return void res.status(404).json({ error: "Snippet not found" });
  res.json(updated);
});

export const remove = handle<Params>(async (req, res) => {
  if (!req.isOwner) return void res.status(403).json({ error: "Only the owner can delete this snippet" });

  const snippet = await snippetService.remove(req.params.id);
  if (!snippet) return void res.status(404).json({ error: "Snippet not found" });
  await Promise.all([
    commentService.removeBySnippetId(req.params.id),
    snapshotService.removeBySnippetId(req.params.id),
  ]);
  res.json({ message: "Snippet deleted" });
});
