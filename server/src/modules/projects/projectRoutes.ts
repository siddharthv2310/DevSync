import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { organizationMiddleware } from "../../middlewares/organizationMiddleware.js";
import { requireOrganizationPermission } from "../../middlewares/permissionMiddleware.js";
import { organizationPermission } from "../manageOrganization/Organization/organizationPermission.js";
import { archiveProjectController, createProjectController, deleteProjectController, getProjectDetailsController, restoreProjectController, updateProjectController } from "./projectController.js";
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

router.patch( "/:projectId/archive",
    authMiddleware,
    organizationMiddleware,
    projectMiddleware,
    requireProjectPermission(projectPermission.ARCHIVE_PROJECT),
    archiveProjectController
  );  


// Restore archived project
router.patch("/:projectId/restore",
    authMiddleware,
    organizationMiddleware,
    projectMiddleware,
    requireProjectPermission(projectPermission.RESTORE_PROJECT),
    restoreProjectController
  );


router.delete( "/:projectId",
    authMiddleware,
    organizationMiddleware,
    requireOrganizationPermission( organizationPermission.DELETE_PROJECT),
    projectMiddleware,
    deleteProjectController
  );
  

export default router;