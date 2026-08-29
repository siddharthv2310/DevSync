import { Router } from "express";
import authRoutes from "../../modules/auth/index.js";
import organizationRoutes from "../../modules/manageOrganization/Organization/index.js"
import invitationsRoute from "../../modules/manageOrganization/invitation/index.js"
import joinRequestRouter from "../../modules/manageOrganization/joinRequest/index.js"
import organizationSettingRouter from "../../modules/manageOrganization/organizationSettings/index.js"
import organizationDiscoveryRouter from "../../modules/manageOrganization/organizationDiscovery/index.js"
import projectRouter from "../../modules/projects/index.js";
import teamRouter from "../../modules/Team/index.js"
import teamDashboardRoute from "../../modules/Team/Dashboard/index.js";

const router = Router(); 

router.use("/auth",authRoutes);
router.use("/organization",organizationRoutes);
router.use("/organizations/:organizationId/invitations",invitationsRoute);
router.use("/invitations", invitationsRoute);
router.use("/organization/:organizationId/join-request",joinRequestRouter);
router.use("/organizations/:organizationId/settings",organizationSettingRouter);
router.use("/organizations/discover",organizationDiscoveryRouter);
router.use("/organizations/:organizationId/projects",projectRouter);
router.use("/organizations/:organizationId/teams",teamRouter);
router.use("organizations/:organizationId/teams/:teamId/dashboard",teamDashboardRoute);

export default router;