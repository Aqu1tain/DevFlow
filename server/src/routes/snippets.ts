import { Router } from "express";
import * as snippetController from "../controllers/snippetController";

const router = Router();

router.get("/", snippetController.getAll);
router.get("/:id", snippetController.getById);
router.post("/", snippetController.create);
router.put("/:id", snippetController.update);
router.delete("/:id", snippetController.remove);

export default router;
