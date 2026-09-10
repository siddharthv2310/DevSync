import { Router } from "express";

import { authMiddleware } from "../../../middlewares/authMiddleware.js";

import { addReactionController, removeReactionController,} from "./reactionController.js";

const router = Router();

router.post( "/messages/:messageId/reactions", authMiddleware, addReactionController);

router.delete( "/messages/:messageId/reactions", authMiddleware, removeReactionController);

export default router;