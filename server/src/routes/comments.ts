import { Router } from "express";
import * as commentController from "../controllers/commentController";
import { authenticate, optionalAuth } from "../middlewares/auth";
import { checkSnippetAccess } from "../middlewares/visibility";

const router = Router({ mergeParams: true });

router.get("/", optionalAuth, checkSnippetAccess, commentController.getAll);
router.post("/", authenticate, checkSnippetAccess, commentController.create);
router.delete("/:commentId", authenticate, commentController.remove);

export default router;
