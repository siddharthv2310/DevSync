import { Router } from "express";
import { authMiddleware } from "../../../middlewares/authMiddleware.js";
import { organizationMiddleware } from "../../../middlewares/organizationMiddleware.js";
import { requireOrganizationPermission } from "../../../middlewares/permissionMiddleware.js";
import { organizationPermission } from "../Organization/organizationPermission.js";
import { getOrganizationSettings, updateOrganizationSettings, updateOrganizationVisibility } from "./organizationSettingController.js";

const router = Router({mergeParams:true});

router.get("/",authMiddleware,organizationMiddleware,requireOrganizationPermission(organizationPermission.VIEW_ORGANIZATION_SETTINGS),getOrganizationSettings);
router.patch("/",authMiddleware,organizationMiddleware,requireOrganizationPermission(organizationPermission.UPDATE_ORGANIZATION_SETTINGS),updateOrganizationSettings);
router.patch("/visibility",authMiddleware, organizationMiddleware,requireOrganizationPermission(organizationPermission.UPDATE_ORGANIZATION_VISIBILITY),updateOrganizationVisibility);

export default router;