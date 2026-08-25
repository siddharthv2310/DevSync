import { Router } from "express";
import { authMiddleware } from "../../../middlewares/authMiddleware.js";
import { discoverOrganizations } from "./OrganizationDiscoveryController.js";

const router = Router();

router.get("/",authMiddleware ,discoverOrganizations);

export default router;