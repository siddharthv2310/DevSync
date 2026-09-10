import { ConversationType, OrganizationRole, projectRole, TeamRole } from "@prisma/client";
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


export const canModerateConversationMessage = async (conversationId: string,userId: string): Promise<boolean> => {

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
        throw new ApiErrors( 404, "Conversation not found");
    }


    // ORGANIZATION CHAT

    if ( conversation.type === ConversationType.ORGANIZATION) {

        if (!conversation.organizationId) {
            throw new ApiErrors( 500, "Invalid organization conversation");
        }


        const membership = await prisma.organizationMember.findUnique({
                where: {
                    organizationId_userId: {
                        organizationId: conversation.organizationId,
                        userId,
                    },
                },
                select: {
                    role: true,
                },
            });


        return ( membership?.role === OrganizationRole.OWNER ||  membership?.role === OrganizationRole.ADMIN);
    }


    // TEAM CHAT

    if ( conversation.type === ConversationType.TEAM ) {

        if (!conversation.teamId) {
            throw new ApiErrors( 500, "Invalid team conversation" );
        }

        const team = await prisma.team.findUnique({
            where: {
                id: conversation.teamId,
            },

            select: {
                organizationId: true,
            },
        });


        if (!team) {
            throw new ApiErrors( 404, "Team not found");
        }


        // Organization OWNER / ADMIN
        const organizationMembership = await prisma.organizationMember.findUnique({
                where: {
                    organizationId_userId: {
                        organizationId:
                            team.organizationId,
                        userId,
                    },
                },

                select: {
                    role: true,
                },
            });


        if (organizationMembership?.role === OrganizationRole.OWNER ||  organizationMembership?.role === OrganizationRole.ADMIN ) 
        {
            return true;
        }


        // Team OWNER / ADMIN
        const teamMembership = await prisma.teamMember.findUnique({
                where: {
                    teamId_userId: {
                        teamId: conversation.teamId,
                        userId,
                    },
                },

                select: {
                    role: true,
                },
            });


        return ( teamMembership?.role === TeamRole.OWNER ||  teamMembership?.role === TeamRole.ADMIN);
    }


    // PROJECT CHAT

    if ( conversation.type === ConversationType.PROJECT) 
    {

        if (!conversation.projectId) {
            throw new ApiErrors( 500, "Invalid project conversation");
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
            throw new ApiErrors( 404, "Project not found");
        }


        // Organization OWNER / ADMIN
        const organizationMembership =  await prisma.organizationMember.findUnique({
                where: {
                    organizationId_userId: {
                        organizationId:
                            project.organizationId,
                        userId,
                    },
                },

                select: {
                    role: true,
                },
            });

            if (organizationMembership?.role === OrganizationRole.OWNER ||  organizationMembership?.role === OrganizationRole.ADMIN ) 
                {
                    return true;
                }


        // Project OWNER / ADMIN
        const projectMembership = await prisma.projectMember.findUnique({
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


        return ( projectMembership?.role === projectRole.OWNER || projectMembership?.role === projectRole.ADMIN );
    }


    // DIRECT CHAT

    return false;
};


export const validateMentionedUsers = async ( conversationId: string, userIds: string[] ): Promise<void> => {

    if (userIds.length === 0) {
        return;
    }

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
        throw new ApiErrors(404, "Conversation not found");
    }

    const uniqueUserIds = [...new Set(userIds)];

    switch (conversation.type) {
        case ConversationType.ORGANIZATION: {

            if (!conversation.organizationId) {
                throw new ApiErrors( 500, "Invalid organization conversation");
            }

            const members = await prisma.organizationMember.findMany({
                    where: {
                        organizationId:
                            conversation.organizationId,
                        userId: {
                            in: uniqueUserIds,
                        },
                    },
                    select: {
                        userId: true,
                    },
                });

            if (members.length !== uniqueUserIds.length) {
                throw new ApiErrors( 400, "One or more mentioned users are not members of this organization" );
            }

            return;
        }

        case ConversationType.TEAM: {

            if (!conversation.teamId) {
                throw new ApiErrors( 500,"Invalid team conversation" );
            }

            const team = await prisma.team.findUnique({
                where: {
                    id: conversation.teamId,
                },
                select: {
                    organizationId: true,
                },
            });

            if (!team) {
                throw new ApiErrors(404, "Team not found");
            }

            const members = await prisma.teamMember.findMany({
                    where: {
                        teamId: conversation.teamId,
                        userId: {
                            in: uniqueUserIds,
                        },
                    },
                    select: {
                        userId: true,
                    },
                });

                const organizationMembers = await prisma.organizationMember.findMany({
                    where: {
                        organizationId: team.organizationId,
                        userId: {
                            in: uniqueUserIds,
                        },
                        role: {
                            in: [
                                OrganizationRole.OWNER,
                                OrganizationRole.ADMIN,
                            ],
                        },
                    },
                    select: {
                        userId: true,
                    },
                });

            const eligibleUserIds = new Set([
                ...members.map((member) => member.userId),
                ...organizationMembers.map((member) => member.userId),
            ]);

            if ( eligibleUserIds.size !== uniqueUserIds.length) {
                throw new ApiErrors( 400, "One or more mentioned users cannot be mentioned in this team conversation");
            }

            return;
        }

        case ConversationType.PROJECT: {

            if (!conversation.projectId) {
                throw new ApiErrors( 500, "Invalid project conversation");
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
                throw new ApiErrors(404, "Project not found");
            }

            const projectMembers = await prisma.projectMember.findMany({
                    where: {
                        projectId: conversation.projectId,
                        userId: {
                            in: uniqueUserIds,
                        },
                    },
                    select: {
                        userId: true,
                        role: true,
                    },
                });

            const organizationMembers = await prisma.organizationMember.findMany({
                    where: {
                        organizationId: project.organizationId,
                        userId: {
                            in: uniqueUserIds,
                        },
                    },
                    select: {
                        userId: true,
                        role: true,
                    },
                });

            // only valid users can be metntioned in the chat;    

            const eligibleUserIds = new Set([
                ...organizationMembers
                    .filter(
                        (member) =>
                            member.role === OrganizationRole.OWNER ||
                            member.role === OrganizationRole.ADMIN
                    )
                    .map((member) => member.userId),

                ...projectMembers
                    .filter(
                        (member) =>
                            member.role === projectRole.OWNER ||
                            member.role === projectRole.ADMIN ||
                            member.role === projectRole.MEMBER
                    )
                    .map((member) => member.userId),
            ]);

            if (
                eligibleUserIds.size !==
                uniqueUserIds.length
            ) {
                throw new ApiErrors(
                    400,
                    "One or more mentioned users cannot be mentioned in this project conversation"
                );
            }

            return;
        }

        case ConversationType.DIRECT: {
            const members = await prisma.conversationMember.findMany({
                    where: {
                        conversationId,
                        userId: {
                            in: uniqueUserIds,
                        },
                    },
                    select: {
                        userId: true,
                    },
                });

            if (members.length !== uniqueUserIds.length) {
                throw new ApiErrors( 400, "One or more mentioned users are not members of this direct conversation");
            }

            return;
        }

        default: 
        throw new ApiErrors(400,"Invalid conversation type");
    }
};