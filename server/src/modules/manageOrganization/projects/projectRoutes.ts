import { Router } from "express";
import { authMiddleware } from "../../../middlewares/authMiddleware.js";
import { organizationMiddleware } from "../../../middlewares/organizationMiddleware.js";
import { requireOrganizationPermission } from "../../../middlewares/permissionMiddleware.js";
import { organizationPermission } from "../Organization/organizationPermission.js";
import { createProjectController, getProjectDetailsController } from "./projectController.js";
import { getOrganizationsController } from "../Organization/organzationController.js";
import { projectMiddleware } from "../../../middlewares/projectMiddleware.js";

const router = Router({mergeParams:true});

router.post("/",authMiddleware , organizationMiddleware,requireOrganizationPermission(organizationPermission.CREATE_PROJECT),createProjectController);
router.get("/",authMiddleware,organizationMiddleware,requireOrganizationPermission(organizationPermission.VIEW_PROJECT),getOrganizationsController);
router.get( "/:projectId",authMiddleware, organizationMiddleware,projectMiddleware,getProjectDetailsController);

export default router;