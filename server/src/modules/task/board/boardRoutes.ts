
import { Router } from "express";
import { requireProjectPermission } from "../../../middlewares/projectPermissionMiddleware.js";
import { projectPermission } from "../../projects/projectPermissions.js";
import {
  getProjectBoardController,
  updateProjectBoardController,
  createBoardColumnController,
  updateBoardColumnController,
  deleteBoardColumnController,
} from "./boardController.js";


const router = Router({ mergeParams: true });

// Get project board
router.get("/",
  requireProjectPermission(projectPermission.VIEW_TASK),
  getProjectBoardController
);

// Update board details
router.patch( "/",
  requireProjectPermission(projectPermission.UPDATE_TASK),
  updateProjectBoardController
);

// Create board column
router.post( "/columns",
  requireProjectPermission(projectPermission.UPDATE_TASK),
  createBoardColumnController
);

// Update board column
router.patch("/columns/:columnId",
  requireProjectPermission(projectPermission.UPDATE_TASK),
  updateBoardColumnController
);

// Delete board column
router.delete("/columns/:columnId",
  requireProjectPermission(projectPermission.UPDATE_TASK),
  deleteBoardColumnController
);

export default router;
