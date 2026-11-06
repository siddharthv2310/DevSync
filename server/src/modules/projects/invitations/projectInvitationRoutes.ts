import { Router } from "express";

import { authMiddleware } from "../../../middlewares/authMiddleware.js";
import { organizationMiddleware } from "../../../middlewares/organizationMiddleware.js";
import { projectMiddleware } from "../../../middlewares/projectMiddleware.js";

import { requireProjectPermission } from "../../../middlewares/projectPermissionMiddleware.js";

import { projectPermission, } from "../projectPermissions.js";

import { createProjectInvitationController, getProjectInvitationsController, } from "./projectInvitationController.js";

const router = Router({ mergeParams: true });

router.post("/:projectId/invitations",
    authMiddleware,
    organizationMiddleware,
    projectMiddleware,
    requireProjectPermission(projectPermission.CREATE_INVITATION),
    createProjectInvitationController
);

router.get("/:projectId/invitations",
    authMiddleware,
    organizationMiddleware,
    projectMiddleware,
    requireProjectPermission(projectPermission.VIEW_INVITATIONS),
    getProjectInvitationsController
);


export default router;