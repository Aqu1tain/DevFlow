import { Request, Response, NextFunction } from "express";
import Snippet, { ISnippet } from "../models/Snippet";

declare global {
  namespace Express {
    interface Request {
      snippet?: ISnippet;
      isOwner?: boolean;
    }
  }
}

type Middleware = (req: Request, res: Response, next: NextFunction) => void;

export const checkSnippetAccess: Middleware = async (req, res, next) => {
  try {
    const snippet = await Snippet.findById(req.params.id);
    if (!snippet) return void res.status(404).json({ error: "Snippet not found" });

    const isOwner = !!req.userId && String(snippet.userId) === req.userId;
    const isAdmin = req.user?.role === "admin";

    if (snippet.visibility === "private" && !isOwner && !isAdmin) {
      return void res.status(403).json({ error: "Access denied" });
    }

    req.snippet = snippet;
    req.isOwner = isOwner || isAdmin;
    next();
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
};
