import { Router } from "express";
import { authMiddleware } from "../../../middlewares/authMiddleware.js";
import { discoverOrganizations, getDiscoverableOrganization } from "./OrganizationDiscoveryController.js";

const router = Router();

router.get("/",authMiddleware ,discoverOrganizations);
router.get("/:slug", authMiddleware, getDiscoverableOrganization);

export default router;