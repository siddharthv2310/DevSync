import { Router } from "express";

import { authMiddleware } from "../../../middlewares/authMiddleware.js";
import { organizationMiddleware } from "../../../middlewares/organizationMiddleware.js";
import { projectMiddleware } from "../../../middlewares/projectMiddleware.js";
import { requireProjectPermission } from "../../../middlewares/projectPermissionMiddleware.js";

import { projectPermission } from "../projectPermissions.js";

import { addProjectMemberController, getProjectMembersController, leaveProjectController, removeProjectMemberController } from "./projectMemberController.js";

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

router.delete("/:projectId/members/:userId",
    authMiddleware,
    organizationMiddleware,
    projectMiddleware,
    requireProjectPermission(projectPermission.REMOVE_MEMBERS),
    removeProjectMemberController
);

router.post("/:projectId/members/leave",
    authMiddleware,
    organizationMiddleware,
    projectMiddleware,
    leaveProjectController
);

export default router;