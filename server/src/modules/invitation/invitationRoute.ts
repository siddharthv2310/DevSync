import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { organizationMiddleware } from "../../middlewares/organizationMiddleware.js";
import { requireOrganizationPermission } from "../../middlewares/permissionMiddleware.js";
import { organizationPermission } from "../Organization/organizationPermission.js";
import { createInvitation } from "./invitationController.js";

const router = Router({ mergeParams: true }); // this is to handle the organizationId parameter that is the parent route 

router.post("/",authMiddleware,organizationMiddleware,requireOrganizationPermission(organizationPermission.INVITE_MEMBERS),createInvitation);

export default router;