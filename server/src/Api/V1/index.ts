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
import chatConversationRoute from "../../modules/chat/conversation/index.js"
import chatMessageRoute from "../../modules/chat/message/index.js"
import threadRoute from "../../modules/chat/threads/index.js"
import reactionRoute from "../../modules/chat/reaction/index.js"


const router = Router(); 

router.use("/auth",authRoute);
router.use("/organization",organizationRoute);
router.use("/organizations/:organizationId/invitations",invitationsRoute);
router.use("/invitations", invitationsRoute);
router.use("/organizations/:organizationId/t",joinRequestRoute);
router.use("/organizations/:organizationId/settings",organizationSettingRoute);
router.use("/organizations/discover",organizationDiscoveryRoute);
router.use("/organizations/:organizationId/projects",projectRoute);
router.use("/organizations/:organizationId/teams",teamRoute);
router.use("/organizations/:organizationId/teams/:teamId/dashboard",teamDashboardRoute);
router.use("/organizations/:organizationId/:teamId/invitations", teamInvitationRoute);
router.use("/organizations/:organizationId/teams/:teamId/join-requests",teamJoinRequestRoute);
router.use("/chat",chatConversationRoute);
router.use("/chat-message",chatMessageRoute);
router.use("/chat-thread", threadRoute);
router.use("/chat-reaction",reactionRoute);

export default router;