
import { Request, Response, NextFunction } from "express";
import { OrganizationRole } from "@prisma/client";

import { ApiErrors } from "../common/errors/ApiErrors.js";
import prisma from "../config/prisma.js";

export const projectMiddleware = async (req: Request,res: Response,next: NextFunction) => {

  try {

    const organizationId = req.params.organizationId as string;

    const projectId  = req.params.projectId as string;

    const userId = req.user?.userId;

    // Validate required information
    if (!organizationId) {
      throw new ApiErrors(400, "Organization ID is required");
    }

    if (!projectId) {
      throw new ApiErrors(400, "Project ID is required");
    }

    if (!userId) {
      throw new ApiErrors(401, "Authentication required");
    }

    // Organization middleware must execute first.
    const organizationMember = req.organizationMember;

    if (!organizationMember) {
      throw new ApiErrors(403, "Organization membership required");
    }

    // Find the project within the requested organization.
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId,
      },
      include: {
        members: {
          where: {
            userId,
          },
          select: {
            id: true,
            role: true,
          },
        },
      },
    });

    if (!project) {
      throw new ApiErrors(404, "Project not found");
    }

    const projectMembership = project.members[0] ?? null;

    // Organization OWNER and ADMIN have organization-level access.
    const isOrganizationManager =
      organizationMember.role === OrganizationRole.OWNER ||
      organizationMember.role === OrganizationRole.ADMIN;

    // Other organization members must belong to the project.
    if (!isOrganizationManager && !projectMembership) {
      throw new ApiErrors(
        403,
        "You do not have access to this project"
      );
    }

    // Attach project information for subsequent middleware/controllers.
    req.project = project;
    req.projectMember = projectMembership;

    return next();
  } 
  catch (error) {
    return next(error);
  }
};
