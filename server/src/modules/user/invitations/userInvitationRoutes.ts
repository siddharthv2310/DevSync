import { Router } from "express";
import { authMiddleware } from "../../../middlewares/authMiddleware.js";
import { getMyProjectInvitationsController } from "./userInvitationController.js";

const router = Router({ mergeParams: true });

router.get("/me/invitations/projects",
    authMiddleware,
    getMyProjectInvitationsController
  );

  export default router;