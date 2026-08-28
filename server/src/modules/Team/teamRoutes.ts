import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { organizationMiddleware } from "../../middlewares/organizationMiddleware.js";
import { requireOrganizationPermission } from "../../middlewares/permissionMiddleware.js";
import { organizationPermission } from "../manageOrganization/Organization/organizationPermission.js";
import { addTeamMemberController, archiveTeamController, createTeamController, getOrganizationTeamsController, getTeamDetailsController, getTeamMembersController, leaveTeamController, removeTeamMemberController, transferTeamOwnershipController, updateTeamController, updateTeamMemberRoleController } from "./teamController.js";
import { teamMiddleware } from "../../middlewares/teamMiddleware.js";
import { teamPermission } from "./teamPermissions.js";
import { requireTeamPermission } from "../../middlewares/teamPermissionMiddleWare.js";

const router = Router({mergeParams:true});

router.post("/", authMiddleware , organizationMiddleware , requireOrganizationPermission(organizationPermission.CREATE_TEAM),createTeamController);
router.get("/",authMiddleware,organizationMiddleware,requireOrganizationPermission(organizationPermission.VIEW_TEAMS),getOrganizationTeamsController);
router.get("/:teamId",authMiddleware,organizationMiddleware,requireOrganizationPermission(organizationPermission.VIEW_TEAMS),teamMiddleware,getTeamDetailsController);
router.get( "/:teamId/members",authMiddleware,organizationMiddleware,teamMiddleware,requireTeamPermission(teamPermission.VIEW_MEMBERS), getTeamMembersController);
router.use("/:teamId/embers",authMiddleware,organizationMiddleware,teamMiddleware,requireTeamPermission(teamPermission.ADD_MEMBERS),addTeamMemberController);
router.patch("/:teamId/members/:userId/role",authMiddleware,organizationMiddleware,teamMiddleware,requireTeamPermission(teamPermission.UPDATE_MEMBER_ROLE),updateTeamMemberRoleController);
router.delete("/:teamId/members/:userId",authMiddleware,organizationMiddleware,teamMiddleware,requireTeamPermission(teamPermission.REMOVE_MEMBERS),removeTeamMemberController);
router.delete("/:teamId/membership",authMiddleware,organizationMiddleware,teamMiddleware,leaveTeamController);
router.patch("/:teamId/ownership",authMiddleware,organizationMiddleware,teamMiddleware,transferTeamOwnershipController);
router.patch("/:teamId",authMiddleware,organizationMiddleware,teamMiddleware,requireTeamPermission(teamPermission.UPDATE_TEAM),updateTeamController);
router.patch("/:teamId/archive",authMiddleware,organizationMiddleware,teamMiddleware,requireTeamPermission(teamPermission.ARCHIVE_TEAM),archiveTeamController);

export default router;
