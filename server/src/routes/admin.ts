import { Request, Response, Router } from "express";
import { authenticate, requireAdmin, requireAdminTotp } from "../middlewares/auth";
import * as snippetService from "../services/snippetService";
import * as commentService from "../services/commentService";
import * as snapshotService from "../services/snapshotService";
import * as userService from "../services/userService";
import { getCache, setCache, delCache } from "../lib/redis";

const STATS_CACHE_KEY = "admin:stats";
const STATS_TTL = 60;

const router = Router();

router.use(authenticate, requireAdmin, requireAdminTotp);

const handle =
  <P = object>(fn: (req: Request<P>, res: Response) => Promise<void>) =>
  async (req: Request<P>, res: Response) => {
    try {
      await fn(req, res);
    } catch (err) {
      console.error("[admin]", req.method, req.originalUrl, err);
      res.status(500).json({ error: "Internal server error" });
    }
  };

router.get("/stats", handle(async (_req, res) => {
  const cached = await getCache(STATS_CACHE_KEY);
  if (cached) return void res.json(JSON.parse(cached));

  const [snippets, users] = await Promise.all([snippetService.getStats(), userService.getStats()]);
  const stats = { snippets, users };
  await setCache(STATS_CACHE_KEY, JSON.stringify(stats), STATS_TTL);
  res.json(stats);
}));

router.get("/snippets", handle(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  res.json(await snippetService.findAll(page));
}));

router.delete("/snippets/:id", handle<{ id: string }>(async (req, res) => {
  const snippet = await snippetService.remove(req.params.id);
  if (!snippet) return void res.status(404).json({ error: "Snippet not found" });
  await Promise.all([
    commentService.removeBySnippetId(req.params.id),
    snapshotService.removeBySnippetId(req.params.id),
    delCache(STATS_CACHE_KEY),
  ]);
  res.json({ message: "Snippet deleted" });
}));

router.delete("/comments/:id", handle<{ id: string }>(async (req, res) => {
  const comment = await commentService.findById(req.params.id);
  if (!comment) return void res.status(404).json({ error: "Comment not found" });
  await commentService.remove(req.params.id);
  res.json({ message: "Comment deleted" });
}));

export default router;
