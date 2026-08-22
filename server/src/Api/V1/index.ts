import { Router } from "express";
import authRoutes from "../../modules/auth/index.js";
import organizationRoutes from "../../modules/Organization/index.js"
import invitations from "../../modules/invitation/index.js"

const router = Router(); 

router.use("/auth",authRoutes);
router.use("/organization",organizationRoutes);
//router.use("/organization/:organizationId/invitations",invitations);

export default router;