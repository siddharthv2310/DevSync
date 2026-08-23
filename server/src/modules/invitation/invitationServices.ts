import { ApiErrors } from "../../common/errors/ApiErrors.js";
import prisma from "../../config/prisma.js";
import { OrganizationRole } from "@prisma/client";
import { generateInvitationToken, hashInvitationToken } from "../../utils/invitation.js";
import { sendOrganizationInvitationEmail } from "../../utils/email.js";
import { error } from "node:console";


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

    if(existingInvitation && !existingInvitation.acceptedAt && existingInvitation.expiredAt > new Date()){
        throw new ApiErrors(409,"An active invitation already exists");
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

    if(invitation.acceptedAt){
        throw new ApiErrors(409,"Invitation has already been accepted");
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
                acceptedAt: new Date()
            },
        })
    });

    return {
        organizationId: invitation.organizationId,
        organizationName: invitation.organization.name,
        role: invitation.role
    };

}