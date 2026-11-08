import { Router } from "express";

import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { organizationMiddleware } from "../../middlewares/organizationMiddleware.js";
import { projectMiddleware } from "../../middlewares/projectMiddleware.js";
import { requireProjectPermission } from "../../middlewares/projectPermissionMiddleware.js";

import { projectPermission } from "../projects/projectPermissions.js";

import {
    createTaskController,
    getTaskDetailsController,
    getProjectTasksController,
    updateTaskController,
    deleteTaskController,
} from "./taskController.js";
import { assignUserToTaskController, getTaskAssigneesController, removeUserFromTaskController } from "./taskAssignmentController.js";

const router = Router({ mergeParams: true });

router.use(
    authMiddleware,
    organizationMiddleware,
    projectMiddleware
);


router.post("/",
    requireProjectPermission(projectPermission.CREATE_TASK),
    createTaskController
);


router.get("/",
    requireProjectPermission(projectPermission.VIEW_TASK),
    getProjectTasksController
);


router.get("/:taskId",
    requireProjectPermission(projectPermission.VIEW_TASK),
    getTaskDetailsController
);


router.patch("/:taskId",
    requireProjectPermission(projectPermission.UPDATE_TASK),
    updateTaskController
);


router.delete("/:taskId",
    requireProjectPermission(projectPermission.DELETE_TASK),
    deleteTaskController
);


router.post("/:taskId/assignees",
    requireProjectPermission(projectPermission.UPDATE_TASK),
    assignUserToTaskController
);


router.get("/:taskId/assignees",
    requireProjectPermission(projectPermission.VIEW_TASK),
    getTaskAssigneesController
);


router.delete("/:taskId/assignees/:userId",
    requireProjectPermission(projectPermission.UPDATE_TASK),
    removeUserFromTaskController
);

export default router;