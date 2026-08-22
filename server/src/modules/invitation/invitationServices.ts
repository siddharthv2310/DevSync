import { ApiErrors } from "../../common/errors/ApiErrors.js";
import prisma from "../../config/prisma.js";
import { OrganizationRole } from "@prisma/client";
import { generateInvitationToken } from "../../utils/invitation.js";


export const createInvition = async(organizationId: string, invitedById: string, email: string, role: OrganizationRole)=>{
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

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

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
                    expiresAt,
                    acceptedAt: null
                }ex
            });
        } 
        

    })




}