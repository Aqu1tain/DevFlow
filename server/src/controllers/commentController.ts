import { Request, Response } from "express";
import * as commentService from "../services/commentService";
import { handle } from "../lib/handle";

type Params = { id: string; commentId?: string };

export const getAll = handle<Params>(async (req, res) => {
  res.json(await commentService.findBySnippetId(req.params.id));
});

export const create = handle<Params>(async (req, res) => {
  if (req.snippet!.visibility === "private") {
    return void res.status(403).json({ error: "Cannot comment on private snippets" });
  }

  const body = req.body.body?.trim();
  if (!body) return void res.status(400).json({ error: "Comment body is required" });
  if (body.length > 2000) return void res.status(400).json({ error: "Comment must be under 2000 characters" });

  res.status(201).json(await commentService.create({
    snippetId: req.params.id,
    userId: req.userId!,
    body,
  }));
});

export const remove = handle<Params>(async (req, res) => {
  const comment = await commentService.findById(req.params.commentId!);
  if (!comment || String(comment.snippetId) !== req.params.id)
    return void res.status(404).json({ error: "Comment not found" });

  const isAuthor = String(comment.userId) === req.userId;
  const isAdmin = req.user?.role === "admin";
  if (!isAuthor && !isAdmin) return void res.status(403).json({ error: "Access denied" });

  await commentService.remove(req.params.commentId!);
  res.json({ message: "Comment deleted" });
});
