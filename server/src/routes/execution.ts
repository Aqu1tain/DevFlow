import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as executionController from "../controllers/executionController";
import { authenticate } from "../middlewares/auth";

const limiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  keyGenerator: (req) => req.userId ?? req.ip ?? "unknown",
  message: { error: "Too many executions, try again in a minute" },
});

const router = Router();

router.post("/", authenticate, limiter, executionController.run);

export default router;
