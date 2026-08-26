import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { organizationMiddleware } from "../../middlewares/organizationMiddleware.js";
import { requireOrganizationPermission } from "../../middlewares/permissionMiddleware.js";
import { organizationPermission } from "../manageOrganization/Organization/organizationPermission.js";
import { createTeamController, getOrganizationTeamsController } from "./teamController.js";

const router = Router({mergeParams:true});

router.post("/", authMiddleware , organizationMiddleware , requireOrganizationPermission(organizationPermission.CREATE_TEAM),createTeamController);
router.get("/",authMiddleware,organizationMiddleware,requireOrganizationPermission(organizationPermission.VIEW_TEAMS),getOrganizationTeamsController)

export default router;
