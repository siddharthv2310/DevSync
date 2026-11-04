import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { organizationMiddleware } from "../../middlewares/organizationMiddleware.js";
import { requireOrganizationPermission } from "../../middlewares/permissionMiddleware.js";
import { organizationPermission } from "../manageOrganization/Organization/organizationPermission.js";
import { createProjectController, getProjectDetailsController, updateProjectController } from "./projectController.js";
//import { getOrganizationsController } from "../manageOrganization/Organization/organzationController.js";
import { getOrganizationProjectsController } from "./projectController.js";
import { projectMiddleware } from "../../middlewares/projectMiddleware.js";
import { requireProjectPermission } from "../../middlewares/projectPermissionMiddleware.js";
import { projectPermission } from "./projectPermissions.js";

const router = Router({ mergeParams: true });

router.post("/",
    authMiddleware,
    organizationMiddleware,
    requireOrganizationPermission(organizationPermission.CREATE_PROJECT),
    createProjectController
);

router.get("/",
    authMiddleware,
    organizationMiddleware,
    requireOrganizationPermission(organizationPermission.VIEW_PROJECT),
    getOrganizationProjectsController
);

router.get("/:projectId",
    authMiddleware,
    organizationMiddleware,
    projectMiddleware,
    requireProjectPermission(projectPermission.VIEW_PROJECT),
    getProjectDetailsController
);

router.patch("/:projectId",
    authMiddleware,
    organizationMiddleware,
    projectMiddleware,
    requireProjectPermission(projectPermission.UPDATE_PROJECT),
    updateProjectController
  );

export default router;