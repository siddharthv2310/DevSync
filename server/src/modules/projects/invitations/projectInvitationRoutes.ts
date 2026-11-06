import { Router } from "express";

import { authMiddleware } from "../../../middlewares/authMiddleware.js";
import { organizationMiddleware } from "../../../middlewares/organizationMiddleware.js";
import { projectMiddleware } from "../../../middlewares/projectMiddleware.js";

import { requireProjectPermission } from "../../../middlewares/projectPermissionMiddleware.js";

import { projectPermission, } from "../projectPermissions.js";

import { acceptProjectInvitationController, createProjectInvitationController, getProjectInvitationsController, rejectProjectInvitationController, } from "./projectInvitationController.js";

const router = Router({ mergeParams: true });

router.post("/",
    authMiddleware,
    organizationMiddleware,
    projectMiddleware,
    requireProjectPermission(projectPermission.CREATE_INVITATION),
    createProjectInvitationController
);

router.get("/",
    authMiddleware,
    organizationMiddleware,
    projectMiddleware,
    requireProjectPermission(projectPermission.VIEW_INVITATIONS),
    getProjectInvitationsController
);


router.post("/accept",
    authMiddleware,
    acceptProjectInvitationController
);

router.post("/reject",
    authMiddleware,
    rejectProjectInvitationController
);

export default router;