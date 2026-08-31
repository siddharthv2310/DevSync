import { Router } from "express";
import { authMiddleware } from "../../../middlewares/authMiddleware.js";
import { organizationMiddleware } from "../../../middlewares/organizationMiddleware.js";
import { requireOrganizationPermission } from "../../../middlewares/permissionMiddleware.js";
import { organizationPermission } from "../Organization/organizationPermission.js";
import { acceptInvitation, cancelInvitation, createInvitation, getOrganizationInvitations,rejectInvitationController } from "./invitationController.js";

const router = Router({ mergeParams: true }); // this is to handle the organizationId parameter that is the parent route 

router.post("/", authMiddleware, organizationMiddleware, requireOrganizationPermission(organizationPermission.INVITE_MEMBERS), createInvitation);
router.get("/", authMiddleware, organizationMiddleware, requireOrganizationPermission(organizationPermission.VIEW_INVITATIONS), getOrganizationInvitations);
router.delete("/:invitationId", authMiddleware,organizationMiddleware,requireOrganizationPermission(organizationPermission.CANCEL_INVITATION),cancelInvitation);
router.post("/accept", authMiddleware, acceptInvitation);
router.use("/reject",authMiddleware,rejectInvitationController);


export default router;