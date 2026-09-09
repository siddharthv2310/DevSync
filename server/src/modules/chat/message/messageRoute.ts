import { Router } from "express";

import { authMiddleware } from "../../../middlewares/authMiddleware.js";
import { createMessageController, deleteMessageController, getMessageController, getMessagesController, updateMessageController } from "./messageController.js";

const router = Router();


router.post("/conversations/:conversationId/messages", authMiddleware,createMessageController);

router.get( "/conversations/:conversationId/messages", authMiddleware, getMessagesController);

router.get( "/messages/:messageId", authMiddleware, getMessageController );

router.patch( "/messages/:messageId", authMiddleware, updateMessageController );

router.delete( "/messages/:messageId", authMiddleware, deleteMessageController );


export default router;