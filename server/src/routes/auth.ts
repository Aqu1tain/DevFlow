import { Router } from "express";
import * as auth from "../controllers/authController";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.post("/register", auth.register);
router.post("/login", auth.login);
router.post("/guest", auth.createGuest);
router.post("/guest/convert", authenticate, auth.convertGuest);
router.get("/me", authenticate, auth.me);
router.get("/github", auth.githubRedirect);
router.get("/github/callback", auth.githubCallback);

export default router;
