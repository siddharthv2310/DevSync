import { Router } from "express";

import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { organizationMiddleware } from "../../middlewares/organizationMiddleware.js";
import { projectMiddleware } from "../../middlewares/projectMiddleware.js";
import { requireProjectPermission } from "../../middlewares/projectPermissionMiddleware.js";

import { projectPermission } from "../projects/projectPermissions.js";

import { createTaskController, getTaskDetailsController, getProjectTasksController, updateTaskController, deleteTaskController, } from "./taskController.js";
import { assignUserToTaskController, getTaskAssigneesController, removeUserFromTaskController } from "./taskAssignmentController.js";
import { assignLabelToTaskController, createTaskLabelController, deleteTaskLabelController, getProjectTaskLabelsController, removeLabelFromTaskController, updateTaskLabelController } from "./taskLabelController.js";
import { createSubtaskController, getTaskSubtasksController } from "./taskSubtaskController.js";
import { createTaskDependencyController, getTaskDependenciesController, removeTaskDependencyController } from "./taskDependencyController.js";
import { createTaskCommentController, deleteTaskCommentController, getTaskCommentsController, updateTaskCommentController } from "./taskComments/taskCommentController.js";

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

// routes related to task assignment

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

// Project label catalog

router.post("/labels",
    requireProjectPermission(projectPermission.MANAGE_TASK_LABELS),
    createTaskLabelController
);

router.get("/labels",
    requireProjectPermission(projectPermission.VIEW_TASK),
    getProjectTaskLabelsController
);

router.patch("/labels/:labelId",
    requireProjectPermission(projectPermission.MANAGE_TASK_LABELS),
    updateTaskLabelController
);

router.delete("/labels/:labelId",
    requireProjectPermission(projectPermission.MANAGE_TASK_LABELS),
    deleteTaskLabelController
);

// Task label assignments
router.post("/:taskId/labels",
    requireProjectPermission(projectPermission.UPDATE_TASK),
    assignLabelToTaskController
);

router.delete("/:taskId/labels/:labelId",
    requireProjectPermission(projectPermission.UPDATE_TASK),
    removeLabelFromTaskController
);


// Subtasks

router.post("/:taskId/subtasks",
    requireProjectPermission(projectPermission.UPDATE_TASK),
    createSubtaskController
);

router.get("/:taskId/subtasks",
    requireProjectPermission(projectPermission.VIEW_TASK),
    getTaskSubtasksController
);


// Task dependencies
router.post("/:taskId/dependencies",
    requireProjectPermission(projectPermission.UPDATE_TASK),
    createTaskDependencyController
);

router.get("/:taskId/dependencies",
    requireProjectPermission(projectPermission.VIEW_TASK),
    getTaskDependenciesController
);

router.delete("/:taskId/dependencies/:blockingTaskId",
    requireProjectPermission(projectPermission.UPDATE_TASK),
    removeTaskDependencyController
);


// Task comments

router.post( "/:taskId/comments",
    requireProjectPermission(projectPermission.CREATE_TASK_COMMENT),
    createTaskCommentController
);

router.get("/:taskId/comments",
    requireProjectPermission(projectPermission.VIEW_TASK),
    getTaskCommentsController
);

router.patch("/:taskId/comments/:commentId",
    requireProjectPermission(projectPermission.UPDATE_TASK_COMMENT),
    updateTaskCommentController
);

router.delete("/:taskId/comments/:commentId",
    requireProjectPermission(projectPermission.DELETE_TASK_COMMENT),
    deleteTaskCommentController
);


export default router;