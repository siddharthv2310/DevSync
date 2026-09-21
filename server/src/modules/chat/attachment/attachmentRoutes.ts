import { Router } from "express";

import { createUploadUrl } from "./attachmentController.js";
import { authMiddleware } from "../../../middlewares/authMiddleware.js";

const router = Router({mergeParams:true});

router.post("/attachments/upload-url",authMiddleware,createUploadUrl);

export default router;