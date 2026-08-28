import { Request, Response, NextFunction } from "express";
import { ApiErrors } from "../common/errors/ApiErrors.js";
import prisma from "../config/prisma.js";
import { OrganizationRole } from "@prisma/client";

export const teamMiddleware = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const userId = req.user?.userId;

        const organizationId = req.params.organizationId as string;

        const teamId = req.params.teamId as string;

        if (!userId) {
            throw new ApiErrors(400, "user ID is required");
        }

        if (!organizationId) {
            throw new ApiErrors(400, "Organization ID is required");
        }

        if (!teamId) {
            throw new ApiErrors(400, "team ID is required");
        }

        const organizationMember = req.organizationMember;

        if (!organizationMember) {
            throw new ApiErrors(403, "Organization membership required");
        }

        const team = await prisma.team.findUnique({
            where: {
                id: teamId,
                organizationId,
                isActive: true
            }
        });

        if (!team) {
            throw new ApiErrors(404, "Team not found");
        }

        const teamMember = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId,
                    userId,
                }
            }
        });


        const isOrgnizationManager = organizationMember.role === OrganizationRole.ADMIN || organizationMember.role === OrganizationRole.OWNER;

        if (!teamMember && !isOrgnizationManager) {
            throw new ApiErrors(403, "You do not have access to this team");
        }

        req.team = team;
        req.teamMember = teamMember;

        next();



    }
    catch (error) {
        next(error);
    }
}