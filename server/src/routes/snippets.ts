import { Router } from "express";
import * as snippetController from "../controllers/snippetController";
import { authenticate, optionalAuth } from "../middlewares/auth";
import { checkSnippetAccess } from "../middlewares/visibility";
import commentRoutes from "./comments";

const router = Router();

router.get("/", optionalAuth, snippetController.getAll);
router.get("/:id", optionalAuth, checkSnippetAccess, snippetController.getById);
router.post("/", authenticate, snippetController.create);
router.put("/:id", authenticate, checkSnippetAccess, snippetController.update);
router.delete("/:id", authenticate, checkSnippetAccess, snippetController.remove);

router.use("/:id/comments", commentRoutes);

export default router;
