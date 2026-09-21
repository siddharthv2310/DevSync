import { Router } from "express";

import { completeUploadController, createUploadUrl } from "./attachmentController.js";
import { authMiddleware } from "../../../middlewares/authMiddleware.js";

const router = Router({mergeParams:true});

router.post("/attachments/upload-url",authMiddleware,createUploadUrl);

router.post("/attachments/:uploadId/complete",authMiddleware , completeUploadController)

export default router;