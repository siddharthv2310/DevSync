import { Router } from "express";

import { authMiddleware } from "../../../middlewares/authMiddleware.js";
import { createMessageController, deleteMessageController, getMessageController, getMessageReadReceiptsController, getMessagesController, getPinnedMessagesController, markMessagesAsReadController, pinMessageController, unpinMessageController, updateMessageController } from "./messageController.js";

const router = Router();


router.post("/conversations/:conversationId/messages", authMiddleware,createMessageController);

router.get( "/conversations/:conversationId/messages", authMiddleware, getMessagesController);

router.get( "/messages/:messageId", authMiddleware, getMessageController );

router.patch( "/messages/:messageId", authMiddleware, updateMessageController );

router.delete( "/messages/:messageId", authMiddleware, deleteMessageController );

router.post( "/conversations/:conversationId/read-receipts", authMiddleware, markMessagesAsReadController);

router.get("/messages/:messageId/read-receipts",authMiddleware,getMessageReadReceiptsController);

router.post( "/messages/:messageId/pin", authMiddleware, pinMessageController);
  
router.delete("/messages/:messageId/pin",authMiddleware,unpinMessageController);

router.get("/conversations/:conversationId/pinned-messages",authMiddleware,getPinnedMessagesController);

export default router;