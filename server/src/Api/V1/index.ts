import { Router } from "express";
import authRoutes from "../../modules/auth/index.js";
import organizationRoutes from "../../modules/manageOrganization/Organization/index.js"
import invitationsRoute from "../../modules/manageOrganization/invitation/index.js"
import joinRequestRouter from "../../modules/manageOrganization/joinRequest/index.js"

const router = Router(); 

router.use("/auth",authRoutes);
router.use("/organization",organizationRoutes);
router.use("/organizations/:organizationId/invitations",invitationsRoute);
router.use("/invitations", invitationsRoute);
router.use("/organization/:organizationId",joinRequestRouter);

export default router;