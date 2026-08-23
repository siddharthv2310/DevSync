import { Router } from "express";
import authRoutes from "../../modules/auth/index.js";
import organizationRoutes from "../../modules/Organization/index.js"
import invitationsRoute from "../../modules/invitation/index.js"

const router = Router(); 

router.use("/auth",authRoutes);
router.use("/organization",organizationRoutes);
router.use("/organizations/:organizationId/invitations",invitationsRoute);

export default router;