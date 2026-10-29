import { Router } from "express";

import { authMiddleware } from "../../../middlewares/authMiddleware.js";
import { createMessageController, deleteMessageController, getMessageController, getMessageReadReceiptsController, getMessagesController, markMessagesAsReadController, updateMessageController } from "./messageController.js";

const router = Router();


router.post("/conversations/:conversationId/messages", authMiddleware,createMessageController);

router.get( "/conversations/:conversationId/messages", authMiddleware, getMessagesController);

router.get( "/messages/:messageId", authMiddleware, getMessageController );

router.patch( "/messages/:messageId", authMiddleware, updateMessageController );

router.delete( "/messages/:messageId", authMiddleware, deleteMessageController );

router.post( "/conversations/:conversationId/read-receipts", authMiddleware, markMessagesAsReadController);

router.get("/messages/:messageId/read-receipts",authMiddleware,getMessageReadReceiptsController);

export default router;