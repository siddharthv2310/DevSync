import { Request, Response, NextFunction } from "express";
import { ApiErrors } from "../common/errors/ApiErrors.js";
import prisma from "../config/prisma.js";
import { OrganizationRole } from "@prisma/client";


export const projectMiddleware = async (req: Request,res: Response,next: NextFunction) => {
    try{
        const organizationId = req.params.organizationId as string;

        const projectId = req.params.projectId as string;

        const userId = req.user?.userId;

        if (!organizationId) {
            throw new ApiErrors( 400,"Organization ID is required");
        }

        if (!projectId) {
            throw new ApiErrors(400,"Project ID is required");
        }

        if (!userId) {
            throw new ApiErrors(401,"Authentication required");
        }




        const organizationMember = req.organizationMember;

        if (!organizationMember) {
            throw new ApiErrors(403,"Organization membership required");
        }

        const project = await prisma.project.findFirst({
                where: {
                    id: projectId,
                    organizationId
                },

                include: {
                    members: {
                        where: {
                            userId
                        },

                        select: {
                            id: true,
                            role: true
                        }
                    }
                }
        });

        if(!project){
            throw new ApiErrors(404, "Project not found");
        }

        const projectMembership = project.members[0] ?? null;

        const isOrganizationManager = organizationMember.role === OrganizationRole.OWNER || organizationMember.role === OrganizationRole.ADMIN;

        if (!isOrganizationManager && !projectMembership) {
            throw new ApiErrors(403,"You do not have access to this project");
        }

        req.project = project;
        req.projectMember = projectMembership;

        next();
    }
    catch(error){
        next(error);
    }
}