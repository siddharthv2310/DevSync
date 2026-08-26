import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { organizationMiddleware } from "../../middlewares/organizationMiddleware.js";
import { requireOrganizationPermission } from "../../middlewares/permissionMiddleware.js";
import { organizationPermission } from "../manageOrganization/Organization/organizationPermission.js";
import { createTeamController, getOrganizationTeamsController, getTeamDetailsController } from "./teamController.js";
import { teamMiddleware } from "../../middlewares/teamMiddleware.js";

const router = Router({mergeParams:true});

router.post("/", authMiddleware , organizationMiddleware , requireOrganizationPermission(organizationPermission.CREATE_TEAM),createTeamController);
router.get("/",authMiddleware,organizationMiddleware,requireOrganizationPermission(organizationPermission.VIEW_TEAMS),getOrganizationTeamsController);
router.get("/:teamId",authMiddleware,organizationMiddleware,requireOrganizationPermission(organizationPermission.VIEW_TEAMS),teamMiddleware,getTeamDetailsController);

export default router;
