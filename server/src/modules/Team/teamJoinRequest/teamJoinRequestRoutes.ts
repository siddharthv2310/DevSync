import { Router } from "express";
import { authMiddleware } from "../../../middlewares/authMiddleware.js";
import { approveTeamJoinRequestController, cancelTeamJoinRequestController, createTeamJoinRequestController, getMyTeamJoinRequestsController, getTeamJoinRequestsController, rejectTeamJoinRequestController } from "./teamJoinRequestController.js";
import { teamMiddleware } from "../../../middlewares/teamMiddleware.js";
import { organizationMiddleware } from "../../../middlewares/organizationMiddleware.js";
import { requireTeamPermission } from "../../../middlewares/teamPermissionMiddleWare.js";
import { teamPermission } from "../teamPermissions.js";

const router = Router({mergeParams:true});

router.post( "/",authMiddleware,createTeamJoinRequestController );
router.get("/",authMiddleware,organizationMiddleware,teamMiddleware,requireTeamPermission(teamPermission.VIEW_JOIN_REQUESTS),getTeamJoinRequestsController);
router.post("/:requestId/approve",authMiddleware,organizationMiddleware,teamMiddleware,requireTeamPermission( teamPermission.APPROVE_JOIN_REQUEST),approveTeamJoinRequestController);
router.post( "/:requestId/reject",authMiddleware,organizationMiddleware,teamMiddleware,requireTeamPermission(teamPermission.REJECT_JOIN_REQUEST),rejectTeamJoinRequestController);
router.post("/:requestId/cancel",authMiddleware,organizationMiddleware,cancelTeamJoinRequestController);
router.get( "/me",authMiddleware,organizationMiddleware,getMyTeamJoinRequestsController);

export default router ;