import { Router } from "express";
import { authMiddleware } from "../../../middlewares/authMiddleware.js";
import { organizationMiddleware } from "../../../middlewares/organizationMiddleware.js";
import { requireOrganizationPermission } from "../../../middlewares/permissionMiddleware.js";
import { organizationPermission } from "../Organization/organizationPermission.js";
import { createProjectController } from "./projectController.js";

const router = Router();

router.use("/",authMiddleware , organizationMiddleware,requireOrganizationPermission(organizationPermission.CREATE_PROJECT),createProjectController);

export default router;