import { Router } from "express";
import { authenticate, requireAdmin } from "../middlewares/auth";
import * as snippetService from "../services/snippetService";
import * as commentService from "../services/commentService";

const router = Router();

router.use(authenticate, requireAdmin);

router.get("/snippets", async (_req, res) => {
  try {
    res.json(await snippetService.findAll());
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/snippets/:id", async (req, res) => {
  try {
    const snippet = await snippetService.remove(req.params.id);
    if (!snippet) return void res.status(404).json({ error: "Snippet not found" });
    await commentService.removeBySnippetId(req.params.id);
    res.json({ message: "Snippet deleted" });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/comments/:id", async (req, res) => {
  try {
    const comment = await commentService.findById(req.params.id);
    if (!comment) return void res.status(404).json({ error: "Comment not found" });
    await commentService.remove(req.params.id);
    res.json({ message: "Comment deleted" });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
