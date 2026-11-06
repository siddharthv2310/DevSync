import { ProjectInvitationStatus, } from "@prisma/client";
import prisma from "../../../config/prisma.js";
import { ApiErrors } from "../../../common/errors/ApiErrors.js";

export const getMyProjectInvitations = async ( userId: string, page: number, limit: number, status?: ProjectInvitationStatus ) => {
    
    const skip = (page - 1) * limit;
  
    const where = {
      invitedUserId: userId,
      ...(status && { status }),
    };
  
    const [invitations, total] = await Promise.all([
      prisma.projectInvitation.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          role: true,
          status: true,
          message: true,
          expiresAt: true,
          respondedAt: true,
          createdAt: true,
  
          project: {
            select: {
              id: true,
              name: true,
              avatar: true,
              organization: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
  
          invitedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      }),
  
      prisma.projectInvitation.count({ where }),
    ]);
  
    return {
      invitations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  };