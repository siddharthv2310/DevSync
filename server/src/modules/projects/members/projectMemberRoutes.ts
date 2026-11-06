import { Router } from "express";

import { authMiddleware } from "../../../middlewares/authMiddleware.js";
import { organizationMiddleware } from "../../../middlewares/organizationMiddleware.js";
import { projectMiddleware } from "../../../middlewares/projectMiddleware.js";
import { requireProjectPermission } from "../../../middlewares/projectPermissionMiddleware.js";

import { projectPermission } from "../projectPermissions.js";

import { addProjectMemberController, getProjectMembersController } from "./projectMemberController.js";

const router = Router({ mergeParams: true });

router.get("/:projectId/members",
    authMiddleware,
    organizationMiddleware,
    projectMiddleware,
    requireProjectPermission(projectPermission.VIEW_MEMBERS),
    getProjectMembersController
);


router.post("/:projectId/members",
    authMiddleware,
    organizationMiddleware,
    projectMiddleware,
    requireProjectPermission(projectPermission.ADD_MEMBERS),
    addProjectMemberController
);

export default router;