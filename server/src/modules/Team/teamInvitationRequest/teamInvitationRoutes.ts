import { Router } from "express";

import { authMiddleware } from "../../../middlewares/authMiddleware.js";

import { organizationMiddleware } from "../../../middlewares/organizationMiddleware.js";

import { teamMiddleware } from "../../../middlewares/teamMiddleware.js";

import { teamPermission }from "../teamPermissions.js";

import {acceptTeamInvitationController, createTeamInvitationController, getTeamInvitationsController, rejectTeamInvitationController} from "./teamInvitationController.js";

import { requireTeamPermission } from "../../../middlewares/teamPermissionMiddleWare.js";


const router = Router({mergeParams: true});


router.post("/",authMiddleware,organizationMiddleware,teamMiddleware,requireTeamPermission(teamPermission.INVITE_MEMBERS),createTeamInvitationController);
router.get("/",authMiddleware,organizationMiddleware,teamMiddleware,requireTeamPermission(teamPermission.VIEW_INVITATIONS),getTeamInvitationsController);
router.post("/accept",authMiddleware,acceptTeamInvitationController);
router.post("/reject",authMiddleware,rejectTeamInvitationController);

export default router;