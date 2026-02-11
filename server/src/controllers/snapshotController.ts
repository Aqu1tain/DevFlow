import * as snapshotService from "../services/snapshotService";
import * as snippetService from "../services/snippetService";
import { handle } from "../lib/handle";
import type { ISnippet } from "../models/Snippet";
import type { ISnapshot } from "../models/Snapshot";

type Params = { id: string; snapshotId?: string };

const contentFields = (source: ISnippet | ISnapshot) => ({
  title: source.title,
  language: source.language,
  description: source.description,
  code: source.code,
  tags: [...source.tags],
});

export const getAll = handle<Params>(async (req, res) => {
  res.json(await snapshotService.findBySnippetId(req.params.id));
});

export const getById = handle<Params>(async (req, res) => {
  const snapshot = await snapshotService.findById(req.params.snapshotId!);
  if (!snapshot) return void res.status(404).json({ error: "Snapshot not found" });
  res.json(snapshot);
});

export const create = handle<Params>(async (req, res) => {
  if (!req.isOwner) return void res.status(403).json({ error: "Only the owner can create snapshots" });

  const name = req.body.name?.trim();
  if (!name) return void res.status(400).json({ error: "Snapshot name is required" });
  if (name.length > 100) return void res.status(400).json({ error: "Name must be under 100 characters" });

  res.status(201).json(await snapshotService.create({
    snippetId: req.params.id,
    userId: req.userId!,
    name,
    ...contentFields(req.snippet!),
  }));
});

export const restore = handle<Params>(async (req, res) => {
  if (!req.isOwner) return void res.status(403).json({ error: "Only the owner can restore snapshots" });

  const snapshot = await snapshotService.findById(req.params.snapshotId!);
  if (!snapshot) return void res.status(404).json({ error: "Snapshot not found" });

  const updated = await snippetService.update(req.params.id, contentFields(snapshot));
  if (!updated) return void res.status(404).json({ error: "Snippet not found" });
  res.json(updated);
});

export const remove = handle<Params>(async (req, res) => {
  if (!req.isOwner) return void res.status(403).json({ error: "Only the owner can delete snapshots" });

  const snapshot = await snapshotService.findById(req.params.snapshotId!);
  if (!snapshot) return void res.status(404).json({ error: "Snapshot not found" });

  await snapshotService.remove(req.params.snapshotId!);
  res.json({ message: "Snapshot deleted" });
});
