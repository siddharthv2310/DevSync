import { Router } from "express";
import { authMiddleware } from "../../../middlewares/authMiddleware.js";
import { createJoinRequest , getOrganizationJoinRequests, approveJoinRequest,rejectJoinRequest,getMyJoinRequest} from "./joinRequestController.js";
import { organizationMiddleware } from "../../../middlewares/organizationMiddleware.js";
import { requireOrganizationPermission } from "../../../middlewares/permissionMiddleware.js";
import { organizationPermission } from "../Organization/organizationPermission.js";


const router =  Router({ mergeParams: true });

router.post("/",authMiddleware ,createJoinRequest);
router.get("/",authMiddleware ,organizationMiddleware, requireOrganizationPermission(organizationPermission.VIEW_JOIN_REQUESTS),getOrganizationJoinRequests)
router.post("/:requestId/approve",authMiddleware,organizationMiddleware,requireOrganizationPermission(organizationPermission.APPROVE_JOIN_REQUEST),approveJoinRequest)
router.post("/:requestId/reject",authMiddleware,organizationMiddleware,requireOrganizationPermission(organizationPermission.REJECT_JOIN_REQUEST),rejectJoinRequest);
router.get("/me",authMiddleware,getMyJoinRequest);


export default router;