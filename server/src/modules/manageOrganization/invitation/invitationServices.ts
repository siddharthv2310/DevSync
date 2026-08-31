import { ApiErrors } from "../../../common/errors/ApiErrors.js";
import prisma from "../../../config/prisma.js";
import { InvitationStatus, OrganizationRole} from "@prisma/client";
import { generateInvitationToken, hashInvitationToken } from "../../../utils/invitation.js";
import { sendOrganizationInvitationEmail } from "../../../utils/email.js";



export const createInvitation = async(organizationId: string, invitedById: string, email: string, role: OrganizationRole)=>{
    const inviter = await prisma.user.findUnique({
        where: {
            id: invitedById
        },
        select: {
            email: true
        }
    });

    if (inviter?.email === email) {
        throw new ApiErrors(400,"You cannot invite yourself");
    }

    const existingMember = await prisma.organizationMember.findFirst({
        where: {
            organizationId,
            user: {
                email
            }
        }
    });

    if (existingMember) {
        throw new ApiErrors(409,"User is already a member" );
    }

    const existingInvitation = await prisma.organizationInvitation.findUnique({
        where: {
            organizationId_email: {
                organizationId,
                email
            }
        }
    });

    if ( existingInvitation && existingInvitation.status === InvitationStatus.PENDING) {
        if (existingInvitation.expiredAt > new Date()) {
            throw new ApiErrors(409,"User already has a pending invitation");
        }
    
        await prisma.organizationInvitation.update({
            where: {
                id: existingInvitation.id
            },
            data: {
                status: InvitationStatus.EXPIRED,
                respondedAt: new Date()
            }
        });
    }



    const { token, tokenHash } = generateInvitationToken();

    const expiredAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const organization = await prisma.$transaction(async(tx)=>{

        const organization = await tx.organization.findUnique({
            where:{
                id:organizationId,
            }
        });

        if (!organization) {
            throw new ApiErrors(404,"Organization not found");
        }

        if (existingInvitation) {
            await tx.organizationInvitation.update({
                where: {
                    id: existingInvitation.id
                },
                data: {
                    tokenHash,
                    role,
                    expiredAt,
                    acceptedAt: null
                }
            });
        } 
        else {
            await tx.organizationInvitation.create({
                data: {
                    organizationId,
                    invitedById,
                    email,
                    role,
                    tokenHash,
                    expiredAt
                }
            });
        }
        return organization;
    })

    await sendOrganizationInvitationEmail(email,organization.name , token);

}


export const acceptInvitation = async (token:string , userId:string)=>{
    const hashedToken = hashInvitationToken(token);

    const invitation = await prisma.organizationInvitation.findFirst({
        where:{
            tokenHash:hashedToken,
        },
        include:{
            organization:{
                select:{
                    id:true,
                    name:true,
                    isActive:true,
                },
            },
        },
    });

    if(!invitation){
        throw new ApiErrors(404,"invalid invitation");
    }

    if(invitation.respondedAt){
        throw new ApiErrors(409,"Invitation has already been responded");
    }

    if(invitation.expiredAt <= new Date()){
        throw new ApiErrors(410, "Invitation has expired");
    }

    if(!invitation.organization.isActive){
        throw new ApiErrors(404, "Organization not found");
    }

    const user = await prisma.user.findUnique({
        where:{
            id:userId,
        },
        select:{
            id:true,
            email:true,
        },
    });

    if(!user){
        throw new ApiErrors(404, "user not found");
    }

    if(user.email.toLowerCase() !== invitation.email.toLowerCase()){
        throw new ApiErrors(403,  "This invitation was sent to a different email address");
    }

    const existingMembership =
        await prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId: invitation.organizationId,
                    userId
                }
            }
        });

    if (existingMembership) {
        throw new ApiErrors(409, "You are already a member of this organization");
    }

    if (invitation.expiredAt <= new Date()) {
        await prisma.organizationInvitation.update({
            where: {
                id: invitation.id
            },

            data: {
                status: InvitationStatus.EXPIRED,
                respondedAt: new Date()
            }
        });

        throw new ApiErrors(410, "Team invitation has expired");
    }

    await prisma.$transaction(async(tx)=>{
        await tx.organizationMember.create({
            data:{
                organizationId:invitation.organizationId,
                userId,
                role: invitation.role,
            },
        });

        await tx.organizationInvitation.update({
            where:{
                id: invitation.id,
            },
            data: {
                respondedAt: new Date()
            },
        })
    });

    return {
        organizationId: invitation.organizationId,
        organizationName: invitation.organization.name,
        role: invitation.role
    };
}

export const rejectInvitation = async (userId: string, rawToken: string) => {

    const tokenHash = hashInvitationToken(rawToken);

    const invitation = await prisma.teamInvitation.findUnique({
        where: {
            tokenHash
        },

        select: {
            id: true,
            teamId: true,
            invitedUserId: true,
            status: true,
            expiresAt: true
        }
    });

    if (!invitation) {
        throw new ApiErrors(404, "Invalid team invitation");
    }


    if (invitation.invitedUserId !== userId) {
        throw new ApiErrors(403, "This invitation was not sent to you");
    }

    if (invitation.status !== InvitationStatus.PENDING) {
        throw new ApiErrors(409, `Invitation is already ${invitation.status.toLowerCase()}`);
    }


    if (invitation.expiresAt <= new Date()) {

        await prisma.teamInvitation.update({
            where: {
                id: invitation.id
            },

            data: {
                status: InvitationStatus.EXPIRED,
                respondedAt: new Date()
            }
        });

        throw new ApiErrors(410, "Team invitation has expired");
    }

    const rejectedInvitation = await prisma.teamInvitation.update({
        where: {
            id: invitation.id
        },

        data: {
            status: InvitationStatus.REJECTED,
            respondedAt: new Date()
        },

        select: {
            id: true,
            status: true,
            respondedAt: true,
            updatedAt: true
        }
    });

    return rejectedInvitation;
};


export const getOrganizationInvitations = async (
    organizationId: string
) => {

    const invitations =
        await prisma.organizationInvitation.findMany({
            where: {
                organizationId,
                acceptedAt: null,
                expiredAt: {
                    gt: new Date()
                }
            },
            select: {
                id: true,
                email: true,
                role: true,
                expiredAt: true,
                invitedAt: true,

                invitedBy: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                }
            },
            orderBy: {
                invitedAt: "desc"
            }
        });

    return invitations;

};


export const cancelInvitation = async ( organizationId: string,invitationId: string,actorRole: OrganizationRole) => {

    const invitation = await prisma.organizationInvitation.findUnique({
        where: {
            id: invitationId
        },
        select: {
            id: true,
            organizationId: true,
            role: true,
            status: true
        }
    });

    if (!invitation || invitation.organizationId !== organizationId) {
        throw new ApiErrors(404, "Invitation not found");
    }

    if (invitation.status === InvitationStatus.ACCEPTED) {
        throw new ApiErrors(
            409,
            "Accepted invitations cannot be cancelled"
        );
    }

    if (invitation.status === InvitationStatus.CANCELLED) {
        throw new ApiErrors(
            409,
            "Invitation is already cancelled"
        );
    }

    // Admin cannot cancel an invitation that grants ADMIN access.
    if (
        actorRole === OrganizationRole.ADMIN &&
        invitation.role === OrganizationRole.ADMIN
    ) {
        throw new ApiErrors(
            403,
            "Admins cannot cancel admin invitations"
        );
    }

    await prisma.organizationInvitation.update({
        where: {
            id: invitationId
        },
        data: {
            status: InvitationStatus.CANCELLED
        }
    });

};


export const expireTeamInvitations = async () => {

    const now = new Date();

    const result = await prisma.teamInvitation.updateMany({
            where: {
                status:InvitationStatus.PENDING,
                expiresAt: {
                    lte: now
                }
            },

            data: {
                status:InvitationStatus.EXPIRED,
                respondedAt: now
            }
        });

    return result.count;
};


