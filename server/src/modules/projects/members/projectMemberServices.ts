import { Prisma, projectRole } from "@prisma/client";
import { ApiErrors } from "../../../common/errors/ApiErrors.js";
import prisma from "../../../config/prisma.js";
import { AddProjectMemberInput, GetProjectMembersQuery } from "./projectMemberValidation.js";

export const getProjectMembers = async (projectId: string, query: GetProjectMembersQuery) => {

    const { page, limit, search } = query;

    const skip = (page - 1) * limit;

    const where = {
        projectId,

        ...(search && {
            user: {
                OR: [
                    {
                        name: {
                            contains: search,
                            mode: "insensitive" as const,
                        },
                    },
                    {
                        username: {
                            contains: search,
                            mode: "insensitive" as const,
                        },
                    },
                    {
                        email: {
                            contains: search,
                            mode: "insensitive" as const,
                        },
                    },
                ],
            },
        }),
    };

    const [members, totalMembers] = await prisma.$transaction([
        prisma.projectMember.findMany({
            where,
            skip,
            take: limit,

            select: {
                id: true,
                userId: true,
                role: true,
                joinedAt: true,

                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        email: true,
                        avatar: true,
                    },
                },
            },

            orderBy: {
                joinedAt: "asc",
            },
        }),

        prisma.projectMember.count({
            where,
        }),
    ]);

    return {
        members,

        pagination: {
            page,
            limit,
            totalMembers,
            totalPages: Math.ceil(totalMembers / limit),
            hasNextPage: page < Math.ceil(totalMembers / limit),
            hasPreviousPage: page > 1,
        },
    };
};


export const addProjectMember = async (organizationId: string, projectId: string, data: AddProjectMemberInput) => {

    try {
        return await prisma.$transaction(async (tx) => {

            // 1. Check whether the project exists in this organization
            const project = await tx.project.findFirst({
                where: {
                    id: projectId,
                    organizationId,
                },
                select: {
                    id: true,
                    isArchived: true,
                },
            });

            if (!project) {
                throw new ApiErrors(404, "Project not found");
            }

            // 2. Do not allow adding members to archived projects
            if (project.isArchived) {
                throw new ApiErrors(
                    409,
                    "Cannot add members to an archived project"
                );
            }

            // 3. Check whether the user belongs to this organization
            const organizationMembership = await tx.organizationMember.findUnique({
                where: {
                    organizationId_userId: {
                        organizationId,
                        userId: data.userId,
                    },
                },
                select: {
                    id: true,
                },
            });

            if (!organizationMembership) {
                throw new ApiErrors(
                    400,
                    "User is not a member of this organization"
                );
            }

            // 4. Check whether the user is already in the project
            const existingMembership = await tx.projectMember.findUnique({
                where: {
                    projectId_userId: {
                        projectId,
                        userId: data.userId,
                    },
                },
            });

            if (existingMembership) {
                throw new ApiErrors(
                    409,
                    "User is already a member of this project"
                );
            }

            // 5. Create project membership
            const newMember = await tx.projectMember.create({
                data: {
                    projectId,
                    userId: data.userId,
                    role: data.role as projectRole,
                },
                select: {
                    id: true,
                    projectId: true,
                    userId: true,
                    role: true,
                    joinedAt: true,

                    user: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            email: true,
                            avatar: true,
                        },
                    },
                },
            });

            return newMember;
        });

    }
    catch (error) {

        // Handle duplicate membership if two requests arrive together
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            throw new ApiErrors(
                409,
                "User is already a member of this project"
            );
        }

        throw error;
    }
};


export const removeProjectMember = async ( organizationId: string, projectId: string, targetUserId: string, requesterUserId: string) => {

    return await prisma.$transaction(async (tx) => {
  
      // 1. Prevent self-removal
      if (targetUserId === requesterUserId) {
        throw new ApiErrors(
          400,
          "You cannot remove yourself using this endpoint"
        );
      }
  
      // 2. Verify project and organization
      const project = await tx.project.findFirst({
        where: {
          id: projectId,
          organizationId,
        },
        select: {
          id: true,
          isArchived: true,
        },
      });
  
      if (!project) {
        throw new ApiErrors(404, "Project not found");
      }
  
      if (project.isArchived) {
        throw new ApiErrors(
          409,
          "Cannot remove members from an archived project"
        );
      }
  
      // 3. Find the requester's project membership
      const requesterMembership = await tx.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: requesterUserId,
          },
        },
        select: {
          role: true,
        },
      });
  
      if (!requesterMembership) {
        throw new ApiErrors(
          403,
          "You must be a project member to remove members"
        );
      }
  
      // 4. Only OWNER and ADMIN can remove members
      if (
        requesterMembership.role !== projectRole.OWNER &&
        requesterMembership.role !== projectRole.ADMIN
      ) {
        throw new ApiErrors(
          403,
          "You do not have permission to remove project members"
        );
      }
  
      // 5. Find the target membership
      const targetMembership = await tx.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: targetUserId,
          },
        },
        select: {
          id: true,
          role: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
  
      if (!targetMembership) {
        throw new ApiErrors(
          404,
          "User is not a member of this project"
        );
      }
  
      // 6. Project OWNER can never be removed directly
      if (targetMembership.role === projectRole.OWNER) {
        throw new ApiErrors(
          403,
          "Project ownership must be transferred before removing the owner"
        );
      }
  
      // 7. ADMIN cannot remove another ADMIN
      if (
        requesterMembership.role === projectRole.ADMIN &&
        targetMembership.role === projectRole.ADMIN
      ) {
        throw new ApiErrors(
          403,
          "Project ADMIN cannot remove another ADMIN"
        );
      }
  
      // 8. Delete the target membership
      await tx.projectMember.delete({
        where: {
          projectId_userId: {
            projectId,
            userId: targetUserId,
          },
        },
      });
  
      return {
        projectId,
        removedMember: targetMembership.user,
        removedRole: targetMembership.role,
        removedBy: requesterUserId,
        removed: true,
      };
    });
  };


  export const leaveProject = async (organizationId: string,projectId: string,userId: string ) => {
    
    return await prisma.$transaction(async (tx) => {
  
      // 1. Verify project
      const project = await tx.project.findFirst({
        where: {
          id: projectId,
          organizationId,
        },
        select: {
          id: true,
          isArchived: true,
        },
      });
  
      if (!project) {
        throw new ApiErrors(404, "Project not found");
      }
  
      if (project.isArchived) {
        throw new ApiErrors(
          409,
          "Cannot leave an archived project"
        );
      }
  
      // 2. Find current user's membership
      const membership = await tx.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
        select: {
          id: true,
          role: true,
        },
      });
  
      if (!membership) {
        throw new ApiErrors(
          404,
          "You are not a member of this project"
        );
      }
  
      // 3. Protect project ownership
      if (membership.role === projectRole.OWNER) {
        throw new ApiErrors(
          403,
          "Transfer project ownership before leaving the project"
        );
      }
  
      // 4. Delete only the current user's membership
      await tx.projectMember.delete({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
      });
  
      return {
        projectId,
        userId,
        role: membership.role,
        left: true,
      };
    });
  };