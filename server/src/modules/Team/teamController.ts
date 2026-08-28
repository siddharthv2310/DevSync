import { Request, Response, NextFunction } from "express";
import { addTeamMemberSchema, createTeamSchema, getTeamMembersQuerySchema, getTeamsQuerySchema, updateTeamMemberRoleSchema } from "./teamValidation.js";
import * as teamService from "./teamServices.js";
import { ApiErrors } from "../../common/errors/ApiErrors.js";


export const createTeamController = async (req: Request, res: Response, next: NextFunction) => {

    try {

        const result = createTeamSchema.safeParse(req.body);

        if (!result.success) {
            throw new ApiErrors(400, "Invalid team data");
        }

        const organizationId = req.params.organizationId as string;

        const userId = req.user?.userId;

        if (!organizationId) {
            throw new ApiErrors(400, "Organization ID is required");
        }

        if (!userId) {
            throw new ApiErrors(401, "Authentication required");
        }

        const team = await teamService.createTeam(organizationId, userId, result.data);

        return res.status(201).json({
            success: true,
            message: "Team created successfully",
            data: team
        });

    }
    catch (error) {
        next(error);
    }
};

export const getOrganizationTeamsController = async (req: Request, res: Response, next: NextFunction) => {

    try {

        const result = getTeamsQuerySchema.safeParse(req.query);

        if (!result.success) {
            throw new ApiErrors(400, "Invalid team query parameters");
        }

        const organizationId = req.params.organizationId as string;

        if (!organizationId) {
            throw new ApiErrors(400, "Organization ID is required");
        }

        const { page, limit, search, includeInactive } = result.data;

        const data = await teamService.getOrganizationTeams(organizationId, page, limit, search, includeInactive);

        return res.status(200).json({
            success: true,
            message: "Teams fetched successfully",
            data: data.teams,
            pagination: data.pagination
        });

    }
    catch (error) {
        next(error);
    }
};

export const getTeamDetailsController = async (req: Request, res: Response, next: NextFunction) => {

    try {

        const teamId = req.params.teamId as string;

        if (!teamId) {
            throw new ApiErrors(400, "Team ID is required");
        }

        const team = await teamService.getTeamDetails(teamId);

        return res.status(200).json({
            success: true,
            message: "Team fetched successfully",
            data: team
        });

    }
    catch (error) {
        next(error);
    }
};

export const getTeamMembersController = async (req: Request, res: Response, next: NextFunction) => {

    try {

        const result = getTeamMembersQuerySchema.safeParse(req.query);

        if (!result.success) {
            throw new ApiErrors(400, "Invalid team member query parameters");
        }

        const teamId = req.params.teamId as string;

        if (!teamId) {
            throw new ApiErrors(400, "Team ID is required");
        }

        const { page, limit, search } = result.data;

        const data = await teamService.getTeamMembers(teamId, page, limit, search);

        return res.status(200).json({
            success: true,
            message: "Team members fetched successfully",
            data: data.members,
            pagination: data.pagination
        });

    }
    catch (error) {
        next(error);
    }
};

export const addTeamMemberController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    try {

        const result = addTeamMemberSchema.safeParse(req.body);

        if (!result.success) {
            throw new ApiErrors(400, "Invalid team member data");
        }

        const organizationId = req.params.organizationId as string;

        const teamId = req.params.teamId as string;

        if (!organizationId) {
            throw new ApiErrors(400, "Organization ID is required");
        }

        if (!teamId) {
            throw new ApiErrors(400, "Team ID is required");
        }

        const { userId, role } = result.data;

        const teamMember = await teamService.addTeamMember(organizationId, teamId, userId, role);

        return res.status(201).json({
            success: true,
            message: "Team member added successfully",
            data: teamMember
        });

    }
    catch (error) {
        next(error);
    }
};

export const updateTeamMemberRoleController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    try {

        const result = updateTeamMemberRoleSchema.safeParse(req.body);

        if (!result.success) {
            throw new ApiErrors(404,"Invalid team member role");
        }

        const organizationId = req.params.organizationId as string;

        const teamId = req.params.teamId as string;

        const targetUserId = req.params.userId as string;

        const actorUserId = req.user?.userId as string;

        if (!organizationId) {
            throw new ApiErrors( 400,"Organization ID is required");
        }

        if (!teamId) {
            throw new ApiErrors(400,"Team ID is required");
        }

        if (!targetUserId) {
            throw new ApiErrors( 400,"User ID is required");
        }

        if (!actorUserId) {
            throw new ApiErrors( 401,"Authentication required" );
        }

        const updatedMember =
            await teamService.updateTeamMemberRole(organizationId,teamId,actorUserId,targetUserId,result.data.role,req.organizationMember!.role);

        return res.status(200).json({
            success: true,
            message: "Team member role updated successfully",
            data: updatedMember
        });

    } 
    catch (error) {
        next(error);
    }
};