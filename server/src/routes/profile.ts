import { Router } from "express";
import { optionalAuth, authenticate, requireRegistered } from "../middlewares/auth";
import { getProfile, updateProfile } from "../controllers/profileController";

const router = Router();

router.get("/:username", optionalAuth, getProfile);
router.put("/", authenticate, requireRegistered, updateProfile);

export default router;
