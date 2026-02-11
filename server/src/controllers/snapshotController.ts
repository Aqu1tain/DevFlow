import mongoose from "mongoose";
import { Request, Response } from "express";
import * as snapshotService from "../services/snapshotService";
import * as snippetService from "../services/snippetService";

type Handler = (req: Request<{ id: string; snapshotId?: string }>, res: Response) => Promise<void>;

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
  res.json(await snapshotService.findBySnippetId(req.params.id));
});

export const getById = handle(async (req, res) => {
  const snapshot = await snapshotService.findById(req.params.snapshotId!);
  if (!snapshot) return void res.status(404).json({ error: "Snapshot not found" });
  res.json(snapshot);
});

export const create = handle(async (req, res) => {
  if (!req.isOwner) return void res.status(403).json({ error: "Only the owner can create snapshots" });

  const name = req.body.name?.trim();
  if (!name) return void res.status(400).json({ error: "Snapshot name is required" });
  if (name.length > 100) return void res.status(400).json({ error: "Name must be under 100 characters" });

  const snippet = req.snippet!;
  res.status(201).json(await snapshotService.create({
    snippetId: req.params.id,
    userId: req.userId!,
    name,
    title: snippet.title,
    language: snippet.language,
    description: snippet.description,
    code: snippet.code,
    tags: [...snippet.tags],
  }));
});

export const restore = handle(async (req, res) => {
  if (!req.isOwner) return void res.status(403).json({ error: "Only the owner can restore snapshots" });

  const snapshot = await snapshotService.findById(req.params.snapshotId!);
  if (!snapshot) return void res.status(404).json({ error: "Snapshot not found" });

  const updated = await snippetService.update(req.params.id, {
    title: snapshot.title,
    language: snapshot.language,
    description: snapshot.description,
    code: snapshot.code,
    tags: [...snapshot.tags],
  });
  if (!updated) return void res.status(404).json({ error: "Snippet not found" });
  res.json(updated);
});

export const remove = handle(async (req, res) => {
  if (!req.isOwner) return void res.status(403).json({ error: "Only the owner can delete snapshots" });

  const snapshot = await snapshotService.findById(req.params.snapshotId!);
  if (!snapshot) return void res.status(404).json({ error: "Snapshot not found" });

  await snapshotService.remove(req.params.snapshotId!);
  res.json({ message: "Snapshot deleted" });
});
