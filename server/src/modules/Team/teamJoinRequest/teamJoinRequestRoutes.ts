import { Router } from "express";
import { authMiddleware } from "../../../middlewares/authMiddleware.js";
import { createTeamJoinRequestController } from "./teamJoinRequestController.js";

const router = Router({mergeParams:true});

router.post( "/",authMiddleware,createTeamJoinRequestController );


export default router ;