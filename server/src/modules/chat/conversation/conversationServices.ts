import { ConversationType, OrganizationRole, projectRole } from "@prisma/client";
import { ApiErrors } from "../../../common/errors/ApiErrors.js";
import prisma from "../../../config/prisma.js";
import { Prisma } from "@prisma/client";

export const getConversationWithMembers = async (conversationId: string) => {
    return await prisma.conversation.findUnique({
        where: {
            id: conversationId,
        },
        include: {
            members: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatar: true,
                        }
                    }
                }
            }
        }
    });
};

export const getOrCreateOrganizationConversation = async (organizationId: string, userId: string) => {
    const organizationMember = await prisma.organizationMember.findUnique({
        where: {
            organizationId_userId: {
                organizationId,
                userId
            },
        },
        select: {
            id: true,
        },
    });

    if (!organizationMember) {
        throw new ApiErrors(403, "You are not a member of this organization");
    }

    const existingConversation = await prisma.conversation.findUnique({
        where: {
            organizationId,
        },
    });

    if (existingConversation) {
        return getConversationWithMembers(existingConversation.id);
    }

    const conversation = await prisma.conversation.create({
        data: {
            type: ConversationType.ORGANIZATION,
            organizationId,
        },
    });



    return getConversationWithMembers(conversation.id)

};

export const getOrCreateTeamConversation = async (organizationId: string, teamId: string, userId: string) => {

    const team = await prisma.team.findUnique({
        where: {
            id: teamId,
            organizationId,
            isActive: true,
        },
        select: {
            id: true,
        },
    });

    if (!team) {
        throw new ApiErrors(404, "Team not found");
    }

    const organizationMember = await prisma.organizationMember.findUnique({
        where: {
            organizationId_userId: {
                organizationId,
                userId,
            },
        },
        select: {
            role: true,
        },
    });

    if (organizationMember?.role !== OrganizationRole.OWNER && organizationMember?.role !== OrganizationRole.ADMIN) {

        const teamMember = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId,
                    userId,
                },
            },
            select: {
                id: true,
            },
        });

        if (!teamMember) {
            throw new ApiErrors(403, "You do not have access to this team conversation");
        }
    }

    const existingConversation = await prisma.conversation.findFirst({
        where: {
            teamId,
        },
    });

    if (existingConversation) {
        return getConversationWithMembers(existingConversation.id);
    }

    const conversation = await prisma.conversation.create({
        data: {
            type: ConversationType.TEAM,
            organizationId,
            teamId,
        },
    });

    return getConversationWithMembers(
        conversation.id
    );

}

export const getOrCreateProjectConversation = async(organizationId:string , projectId:string , userId:string)=>{

    const project = await prisma.project.findUnique({
        where: {
            id: projectId,
            organizationId,
            isArchieved: false,
        },
        select: {
            id: true,
        },
    });

    if (!project) {
        throw new ApiErrors(404,"Project not found");
    }

    const organizationMember =
        await prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId,
                    userId,
                },
            },
            select: {
                role: true,
            },
        });

        if ( organizationMember?.role !== OrganizationRole.OWNER && organizationMember?.role !== OrganizationRole.ADMIN ) {
    
            const projectMember = await prisma.projectMember.findUnique({
                    where: {
                        projectId_userId: {
                            projectId,
                            userId,
                        },
                    },
                    select: {
                        role: true,
                    },
                });
    
            if (
                projectMember?.role !== projectRole.OWNER &&
                projectMember?.role !== projectRole.ADMIN &&
                projectMember?.role !== projectRole.MEMBER
            ) {

                throw new ApiErrors( 403, "You do not have access to this project conversation" );
            }
        }    

        const existingConversation = await prisma.conversation.findUnique({
            where: {
                projectId,
            },
        });

        if (existingConversation) {
            return getConversationWithMembers(
                existingConversation.id
            );
        }

        const conversation = await prisma.conversation.create({
            data: {
                type: ConversationType.PROJECT,
                organizationId,
                projectId,
            },
        });

        return getConversationWithMembers(
            conversation.id
        );

}

const createDirectKey = async(userId1 : string , userId2 : string) : Promise<string> =>{
    return [userId1,userId2].sort().join(":");
};

export const getOrCreateDirectConversation = async(userId : string ,otherUserId:string)=>{
    if(userId === otherUserId){
        throw new ApiErrors(400 , "You cannot create a direct conversation with yourself");
    }

    const otherUser = await prisma.user.findUnique({
        where: {
            id: otherUserId,
        },
        select: {
            id: true,
        },
    });

    if (!otherUser) {
        throw new ApiErrors(404,"User not found" );
    }

    const directKey  = await createDirectKey(userId , otherUserId) ;

    const existingConversation = await prisma. conversation.findUnique({
        where:{
            directKey,
        },
        include:{
            members:{
                include:{
                    user:{
                        select:{
                            id: true,
                            name: true,
                            email: true,
                            avatar: true,
                        }
                    }
                }
            }
        }
    })

    if (existingConversation) {
        return existingConversation;
    }

    try{
        const conversation = await prisma.$transaction(async(tx)=>{

            const newConversation = await tx.conversation.create({
                data: {
                    type: ConversationType.DIRECT,
                    directKey,
                },
            });

            await tx.conversationMember.createMany({
                data: [
                    {
                        conversationId: newConversation.id,
                        userId,
                    },
                    {
                        conversationId: newConversation.id,
                        userId: otherUserId,
                    },
                ],
            });

            // here this query will find the unique value othervise it will return error but in findUnique it will return null instead of error
            return tx.conversation.findUniqueOrThrow({
                where: {
                    id: newConversation.id,
                },
                include: {
                    members: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    avatar: true,
                                },
                            },
                        },
                    },
                },
            });


        });

        return conversation;

    }
    catch(error){

        if ( error instanceof Prisma.PrismaClientKnownRequestError &&  error.code === "P2002" ) {
            const conversation = await prisma.conversation.findUnique({
                    where: {
                        directKey,
                    },
                    include: {
                        members: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        avatar: true,
                                    },
                                },
                            },
                        },
                    },
                });

            if (conversation) {
                return conversation;
            }
        }

        throw error;

    }

}