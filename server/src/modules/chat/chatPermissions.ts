import { ConversationType, OrganizationRole, projectRole } from "@prisma/client";
import { ApiErrors } from "../../common/errors/ApiErrors.js";
import prisma from "../../config/prisma.js";


export const canAccessConversations = async (conversationId: string, userId: string): Promise<boolean> => {
    const conversation = await prisma.conversation.findUnique({
        where: {
            id: conversationId,
        },
        select: {
            type: true,
            organizationId: true,
            teamId: true,
            projectId: true,
        },
    });

    if (!conversation) {
        throw new ApiErrors(404, "Conversation not found")
    }

    switch (conversation.type) {

        case ConversationType.ORGANIZATION: {
            if (!conversation.organizationId) {
                throw new ApiErrors(500, "Invalid organization conversation");
            }

            const organizationMembers = await prisma.organizationMember.findUnique({
                where: {
                    organizationId_userId: {
                        organizationId: conversation.organizationId,
                        userId,
                    },
                },

                select: {
                    id: true,
                }
            });

            return !!organizationMembers
        }

        case ConversationType.TEAM: {

            if (!conversation.teamId) {
                throw new ApiErrors(500, "Invalid team conversation");
            }

            const team = await prisma.team.findUnique({
                where: {
                    id: conversation.teamId
                },
                select: {
                    organizationId: true,
                }
            });

            if (!team) {
                throw new ApiErrors(404, "Team not found");
            }

            const organizationMember = await prisma.organizationMember.findUnique({
                where: {
                    organizationId_userId: {
                        organizationId: team.organizationId,
                        userId,
                    },
                },
                select: {
                    role: true,
                },
            });

            if (!organizationMember) {
                throw new ApiErrors(403, "you are not organization memeber");
            }

            if (organizationMember?.role === OrganizationRole.OWNER || organizationMember?.role === OrganizationRole.ADMIN) {
                return true;
            }

            const teamMember = await prisma.teamMember.findUnique({
                where: {
                    teamId_userId: {
                        teamId: conversation.teamId,
                        userId,
                    },
                },
                select: {
                    id: true,
                },
            });

            return !!teamMember;
        }

        case ConversationType.PROJECT: {
            if (!conversation.projectId) {
                throw new ApiErrors(500,"Invalid project conversation");
            }
        
            const project = await prisma.project.findUnique({
                where: {
                    id: conversation.projectId,
                },
                select: {
                    organizationId: true,
                },
            });
        
            if (!project) {
                throw new ApiErrors(404,"Project not found");
            }
        
            const organizationMember = await prisma.organizationMember.findUnique({
                    where: {
                        organizationId_userId: {
                            organizationId: project.organizationId,
                            userId,
                        },
                    },
                    select: {
                        role: true,
                    },
                });
        
            if (organizationMember?.role === OrganizationRole.OWNER || organizationMember?.role === OrganizationRole.ADMIN) {
                return true;
            }
        
            const projectMember = await prisma.projectMember.findUnique({
                    where: {
                        projectId_userId: {
                            projectId: conversation.projectId,
                            userId,
                        },
                    },
                    select: {
                        role: true,
                    },
                });
        
            if (!projectMember) {
                return false;
            }
        
            return (
                projectMember.role === projectRole.OWNER ||
                projectMember.role === projectRole.ADMIN ||
                projectMember.role === projectRole.MEMBER
            );
        }

        case ConversationType.DIRECT: {
            const member = await prisma.conversationMember.findUnique({
                where: {
                    conversationId_userId: {
                        conversationId,
                        userId,
                    },
                },
                select: {
                    id: true,
                },
            });

            return !!member;
        }

        default:
            return false;

    }
}



export const requireConversationAccess = async ( conversationId: string, userId: string): Promise<void> => {

    const allowed = await canAccessConversations( conversationId, userId );

    if (!allowed) {
        throw new ApiErrors( 403, "You do not have access to this conversation");
    }
};