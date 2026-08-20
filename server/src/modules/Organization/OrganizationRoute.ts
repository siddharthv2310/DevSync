import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { createOrganizationController, getOrganizationsController, getOrganizationInfo } from "./organzationController.js";
import { organizationMiddleware } from "../../middlewares/organizationMiddleware.js";

const router = Router();

router.post("/",authMiddleware,createOrganizationController);
router.get("/",authMiddleware,getOrganizationsController);
router.get("/:organizationId",authMiddleware , organizationMiddleware,getOrganizationInfo);


export default router;
