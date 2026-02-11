import { Request, Response, Router } from "express";
import { authenticate, requireAdmin } from "../middlewares/auth";
import * as snippetService from "../services/snippetService";
import * as commentService from "../services/commentService";

const router = Router();

router.use(authenticate, requireAdmin);

type Handler = (req: Request<{ id: string }>, res: Response) => Promise<void>;

const handle = (fn: Handler): Handler => async (req, res) => {
  try {
    await fn(req, res);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
};

router.get("/snippets", handle(async (_req, res) => {
  res.json(await snippetService.findAll());
}));

router.delete("/snippets/:id", handle(async (req, res) => {
  const snippet = await snippetService.remove(req.params.id);
  if (!snippet) return void res.status(404).json({ error: "Snippet not found" });
  await commentService.removeBySnippetId(req.params.id);
  res.json({ message: "Snippet deleted" });
}));

router.delete("/comments/:id", handle(async (req, res) => {
  const comment = await commentService.findById(req.params.id);
  if (!comment) return void res.status(404).json({ error: "Comment not found" });
  await commentService.remove(req.params.id);
  res.json({ message: "Comment deleted" });
}));

export default router;
