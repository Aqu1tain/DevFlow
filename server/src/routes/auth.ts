import { Router } from "express";
import * as auth from "../controllers/authController";
import { authenticate, requireRegistered } from "../middlewares/auth";

const router = Router();

router.post("/register", auth.register);
router.post("/login", auth.login);
router.post("/guest", auth.createGuest);
router.post("/guest/convert", authenticate, auth.convertGuest);
router.get("/me", authenticate, auth.me);
router.get("/github", auth.githubRedirect);
router.get("/github/callback", auth.githubCallback);

router.post("/totp/verify", auth.verifyTotp);
router.get("/totp/setup", authenticate, requireRegistered, auth.setupTotp);
router.post("/totp/enable", authenticate, requireRegistered, auth.enableTotp);
router.delete("/totp/disable", authenticate, requireRegistered, auth.disableTotp);

export default router;
