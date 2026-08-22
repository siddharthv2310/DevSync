import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { createOrganizationController, getOrganizationsController, getOrganizationInfo ,getOrganizationMembers,updateMemberRole,removeMember,leaveOrganization, transferOwnership } from "./organzationController.js";
import { organizationMiddleware } from "../../middlewares/organizationMiddleware.js";
import { requireOrganizationPermission } from "../../middlewares/permissionMiddleware.js";
import { organizationPermission } from "./organizationPermission.js";

const router = Router();

router.post("/",authMiddleware,createOrganizationController);
router.get("/",authMiddleware,getOrganizationsController);
router.get("/:organizationId",authMiddleware , organizationMiddleware,requireOrganizationPermission(organizationPermission.VIEW_ORGANIZATION),getOrganizationInfo);
router.get("/:organizationId/members",authMiddleware , organizationMiddleware,requireOrganizationPermission(organizationPermission.VIEW_MEMBERS),getOrganizationMembers);
router.patch("/:organizationId/members/:userId/role",authMiddleware,organizationMiddleware,requireOrganizationPermission(organizationPermission.UPDATE_MEMBER_ROLE),updateMemberRole);
router.delete("/:organizationId/members/:userId",authMiddleware,organizationMiddleware,requireOrganizationPermission(organizationPermission.UPDATE_MEMBER_ROLE),removeMember)
router.delete("/:organizationId/membership",authMiddleware,organizationMiddleware,leaveOrganization);
router.patch("/:organizationId/ownership",authMiddleware,organizationMiddleware,requireOrganizationPermission( organizationPermission.TRANSFER_OWNERSHIP),transferOwnership);

export default router;
