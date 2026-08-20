import { Router } from "express";
import authRoutes from "../../modules/auth/index.js";
import organizationRoutes from "../../modules/Organization/index.js"

const router = Router();

router.use("/auth",authRoutes);
router.use("/organization",organizationRoutes);

export default router;