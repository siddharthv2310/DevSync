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

export default router;