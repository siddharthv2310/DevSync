import { Router } from "express";
import authRoute from "../../modules/auth/index.js";
import organizationRoute from "../../modules/manageOrganization/Organization/index.js"
import invitationsRoute from "../../modules/manageOrganization/invitation/index.js"
import joinRequestRoute from "../../modules/manageOrganization/joinRequest/index.js"
import organizationSettingRoute from "../../modules/manageOrganization/organizationSettings/index.js"
import organizationDiscoveryRoute from "../../modules/manageOrganization/organizationDiscovery/index.js"
import projectRoute from "../../modules/projects/index.js";
import teamRoute from "../../modules/Team/index.js"
import teamDashboardRoute from "../../modules/Team/Dashboard/index.js";
import teamInvitationRoute from "../../modules/Team/teamInvitationRequest/index.js";
import teamJoinRequestRoute from "../../modules/Team/teamJoinRequest/index.js";


const router = Router(); 

router.use("/auth",authRoute);
router.use("/organization",organizationRoute);
router.use("/organizations/:organizationId/invitations",invitationsRoute);
router.use("/invitations", invitationsRoute);
router.use("/organizations/:organizationId/join-request",joinRequestRoute);
router.use("/organizations/:organizationId/settings",organizationSettingRoute);
router.use("/organizations/discover",organizationDiscoveryRoute);
router.use("/organizations/:organizationId/projects",projectRoute);
router.use("/organizations/:organizationId/teams",teamRoute);
router.use("/organizations/:organizationId/teams/:teamId/dashboard",teamDashboardRoute);
router.use("/organizations/:organizationId/:teamId/invitations", teamInvitationRoute);
router.use("/organizations/:organizationId/teams/:teamId/join-requests",teamJoinRequestRoute);

export default router;