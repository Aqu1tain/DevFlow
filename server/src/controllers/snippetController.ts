import mongoose from "mongoose";
import { Request, Response } from "express";
import * as snippetService from "../services/snippetService";

type Handler = (req: Request<{ id: string }>, res: Response) => Promise<void>;

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
  res.json(await snippetService.findPublicAndOwn(req.userId));
});

export const getById = handle(async (req, res) => {
  res.json(req.snippet);
});

export const create = handle(async (req, res) => {
  res.status(201).json(await snippetService.create({ ...req.body, userId: req.userId }));
});

export const update = handle(async (req, res) => {
  const snippet = req.snippet!;
  if (snippet.visibility !== "public" && !req.isOwner) {
    return void res.status(403).json({ error: "Access denied" });
  }

  const updated = await snippetService.update(req.params.id, req.body);
  if (!updated) return void res.status(404).json({ error: "Snippet not found" });
  res.json(updated);
});

export const remove = handle(async (req, res) => {
  if (!req.isOwner) return void res.status(403).json({ error: "Only the owner can delete this snippet" });

  const snippet = await snippetService.remove(req.params.id);
  if (!snippet) return void res.status(404).json({ error: "Snippet not found" });
  res.json({ message: "Snippet deleted" });
});
