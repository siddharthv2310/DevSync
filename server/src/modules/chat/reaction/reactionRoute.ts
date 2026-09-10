import { Router } from "express";

import { authMiddleware } from "../../../middlewares/authMiddleware.js";

import { addReactionController, getMessageReactionsController, removeReactionController,} from "./reactionController.js";

const router = Router();

router.post( "/messages/:messageId/reactions", authMiddleware, addReactionController);

router.delete( "/messages/:messageId/reactions", authMiddleware, removeReactionController);

router.get("/messages/:messageId/reactions", authMiddleware, getMessageReactionsController);

export default router;