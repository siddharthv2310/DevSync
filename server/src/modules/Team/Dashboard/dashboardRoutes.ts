import { Router } from "express";
import { authMiddleware } from "../../../middlewares/authMiddleware.js";
import { organizationMiddleware } from "../../../middlewares/organizationMiddleware.js";
import { teamMiddleware } from "../../../middlewares/teamMiddleware.js";
import { requireOrganizationPermission } from "../../../middlewares/permissionMiddleware.js";
import { organizationPermission } from "../../manageOrganization/Organization/organizationPermission.js";
import { getTeamDashboardController } from "./dashboardController.js";

const router = Router({ mergeParams: true });


router.get("/",authMiddleware,organizationMiddleware,teamMiddleware,requireOrganizationPermission(organizationPermission.VIEW_TEAMS),getTeamDashboardController);


export default router;