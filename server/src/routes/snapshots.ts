import { Router } from "express";
import * as snapshotController from "../controllers/snapshotController";
import { authenticate } from "../middlewares/auth";
import { checkSnippetAccess } from "../middlewares/visibility";

const router = Router({ mergeParams: true });

router.get("/", authenticate, checkSnippetAccess, snapshotController.getAll);
router.get("/:snapshotId", authenticate, checkSnippetAccess, snapshotController.getById);
router.post("/", authenticate, checkSnippetAccess, snapshotController.create);
router.post("/:snapshotId/restore", authenticate, checkSnippetAccess, snapshotController.restore);
router.delete("/:snapshotId", authenticate, checkSnippetAccess, snapshotController.remove);

export default router;
