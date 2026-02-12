import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate, requireRegistered } from "../middlewares/auth";
import { createCheckout, createPortal } from "../controllers/billingController";

const limiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  keyGenerator: (req) => req.userId ?? "unknown",
  validate: { ip: false },
  message: { error: "Too many billing requests, try again in a minute" },
});

const router = Router();

router.post("/checkout", authenticate, requireRegistered, limiter, createCheckout);
router.post("/portal", authenticate, requireRegistered, limiter, createPortal);

export default router;
