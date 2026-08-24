import { Router } from "express";
import { authMiddleware } from "../../../middlewares/authMiddleware.js";
import { createJoinRequest } from "./joinRequestController.js";
import { organizationMiddleware } from "../../../middlewares/organizationMiddleware.js";


const router =  Router({ mergeParams: true });

router.post("/join-requests",authMiddleware ,createJoinRequest);



export default router;