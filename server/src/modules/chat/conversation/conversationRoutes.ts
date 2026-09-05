import { Router } from "express";
import { authMiddleware } from "../../../middlewares/authMiddleware.js";
import { organizationMiddleware } from "../../../middlewares/organizationMiddleware.js";
import { createDirectConversation, createOrganizationConversation, createProjectConversation, createTeamConversation, getConversation } from "./conversationController.js";


const router = Router();

router.get("/organizations/:organizationId/conversation",authMiddleware,organizationMiddleware,createOrganizationConversation);

router.get( "/organizations/:organizationId/teams/:teamId/conversation",authMiddleware,organizationMiddleware,createTeamConversation);

router.get( "/organizations/:organizationId/projects/:projectId/conversation", authMiddleware, organizationMiddleware, createProjectConversation );

router.post( "/conversations/direct", authMiddleware, createDirectConversation );

router.get( "/conversations/:conversationId",authMiddleware,getConversation );



export default router;