import { Router } from "express";

import { authMiddleware } from "../../../middlewares/authMiddleware.js";

import { getThreadController, } from "./threadController.js";

const router = Router();

router.get( "/messages/:messageId/thread",authMiddleware,getThreadController);

export default router;