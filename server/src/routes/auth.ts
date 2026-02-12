import { Router } from "express";
import * as auth from "../controllers/authController";
import { authenticate, requireAdmin } from "../middlewares/auth";

const router = Router();

router.post("/register", auth.register);
router.post("/login", auth.login);
router.post("/guest", auth.createGuest);
router.post("/guest/convert", authenticate, auth.convertGuest);
router.get("/me", authenticate, auth.me);
router.get("/github", auth.githubRedirect);
router.get("/github/callback", auth.githubCallback);

router.post("/totp/verify", auth.verifyTotp);
router.get("/totp/setup", authenticate, requireAdmin, auth.setupTotp);
router.post("/totp/enable", authenticate, requireAdmin, auth.enableTotp);
router.delete("/totp/disable", authenticate, requireAdmin, auth.disableTotp);

export default router;
