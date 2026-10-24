import { Router } from "express";

import { completeUploadController, createUploadUrl, downloadAttachmentController } from "./attachmentController.js";
import { authMiddleware } from "../../../middlewares/authMiddleware.js";

const router = Router({mergeParams:true});

router.post("/attachments/upload-url",authMiddleware,createUploadUrl);

router.post("/attachments/:uploadId/complete",authMiddleware , completeUploadController)

router.get("/attachments/:attachmentId/download",authMiddleware,downloadAttachmentController);

export default router;