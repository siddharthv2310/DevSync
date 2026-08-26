import prisma from "../../config/prisma.js";
import Prisma, { TeamRole } from "@prisma/client";
import { CreateTeamInput } from "./teamValidation.js";
import { ApiErrors } from "../../common/errors/ApiErrors.js";


export const createTeam = async (organizationId: string, userId: string, data: CreateTeamInput) => {
    try {

        const organization =
            await prisma.organization.findUnique({
                where: {
                    id: organizationId
                },
                select: {
                    id: true,
                    isActive: true
                }
            });

        if (!organization || !organization.isActive) {
            throw new ApiErrors(404, "Organization not found");
        }

        const existingTeam = await prisma.team.findUnique({
            where: {
                organizationId_slug: {
                    organizationId,
                    slug: data.slug
                }
            },
            select: {
                id: true
            }
        });

        if (existingTeam) {
            throw new ApiErrors(409, "A team with this slug already exists in this organization");
        }

        const team =
            await prisma.$transaction(async (tx) => {

                const newTeam = await tx.team.create({
                    data: {
                        organizationId,
                        name: data.name,
                        slug: data.slug,
                        description: data.description || null,
                        avatar: data.avatar || null
                    }
                });

                await tx.teamMember.create({
                    data: {
                        teamId: newTeam.id,
                        userId,
                        role: TeamRole.OWNER
                    }
                });

                return newTeam;
            });

        return team;


    }
    catch (error) {
       throw new ApiErrors(  409,"A team with this slug already exists in this organization")
    }
}