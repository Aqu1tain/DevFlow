import { Request, Response } from "express";
import * as snippetService from "../services/snippetService";

export const getAll = async (_req: Request, res: Response) => {
  try {
    const snippets = await snippetService.findAll();
    res.json(snippets);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch snippets" });
  }
};

export const getById = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const snippet = await snippetService.findById(req.params.id);
    if (!snippet) {
      res.status(404).json({ error: "Snippet not found" });
      return;
    }
    res.json(snippet);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch snippet" });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const snippet = await snippetService.create(req.body);
    res.status(201).json(snippet);
  } catch (err) {
    res.status(500).json({ error: "Failed to create snippet" });
  }
};

export const update = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const snippet = await snippetService.update(req.params.id, req.body);
    if (!snippet) {
      res.status(404).json({ error: "Snippet not found" });
      return;
    }
    res.json(snippet);
  } catch (err) {
    res.status(500).json({ error: "Failed to update snippet" });
  }
};

export const remove = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const snippet = await snippetService.remove(req.params.id);
    if (!snippet) {
      res.status(404).json({ error: "Snippet not found" });
      return;
    }
    res.json({ message: "Snippet deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete snippet" });
  }
};
