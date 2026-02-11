import { Router } from "express";
import * as executionController from "../controllers/executionController";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.post("/", authenticate, executionController.run);

export default router;
