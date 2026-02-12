import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as aiController from "../controllers/aiController";
import { authenticate, requirePro } from "../middlewares/auth";

const limiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  keyGenerator: (req) => req.userId ?? req.ip ?? "unknown",
  message: { error: "Too many AI requests, try again in a minute" },
});

const router = Router();

router.post("/", authenticate, requirePro, limiter, aiController.ask);

export default router;
