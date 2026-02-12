import { Router } from "express";
import { authenticate, requireRegistered } from "../middlewares/auth";
import { createCheckout, createPortal } from "../controllers/billingController";

const router = Router();

router.post("/checkout", authenticate, requireRegistered, createCheckout);
router.post("/portal", authenticate, requireRegistered, createPortal);

export default router;
