import mongoose from "mongoose";
import { Request, Response } from "express";
import * as commentService from "../services/commentService";

type Handler = (req: Request<{ id: string; commentId?: string }>, res: Response) => Promise<void>;

const isCastError = (err: unknown) =>
  err instanceof mongoose.Error.CastError;

const isValidationError = (err: unknown) =>
  err instanceof mongoose.Error.ValidationError;

const handle =
  (fn: Handler): Handler =>
  async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      if (isCastError(err)) return void res.status(400).json({ error: "Invalid ID format" });
      if (isValidationError(err)) return void res.status(400).json({ error: (err as mongoose.Error.ValidationError).message });
      res.status(500).json({ error: "Internal server error" });
    }
  };

export const getAll = handle(async (req, res) => {
  res.json(await commentService.findBySnippetId(req.params.id));
});

export const create = handle(async (req, res) => {
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

export const remove = handle(async (req, res) => {
  const comment = await commentService.findById(req.params.commentId!);
  if (!comment) return void res.status(404).json({ error: "Comment not found" });

  const isAuthor = String(comment.userId) === req.userId;
  const isAdmin = req.user?.role === "admin";
  if (!isAuthor && !isAdmin) return void res.status(403).json({ error: "Access denied" });

  await commentService.remove(req.params.commentId!);
  res.json({ message: "Comment deleted" });
});
