import { OrganizationRole } from "@prisma/client";
import prisma from "../../config/prisma.js"
import { createOrganisationinput } from "./organizationvalidation.js";
import { ApiErrors } from "../../common/errors/ApiErrors.js";
import { organizationPermission } from "./organizationPermission.js";
import { error } from "node:console";



export const createOrganisation = async( userId:string , data:createOrganisationinput)=>{
        const existingOrganisation = await prisma.organization.findUnique({
            where:{
                slug : data.slug,
            },
        });

        if(existingOrganisation){
            throw new ApiErrors(409,"Organisation with this slug already exists");
        }

        const organization = await prisma.$transaction(async (tx) => {
            const newOrganization = await tx.organization.create({
                data: {
                    name: data.name,
                    slug: data.slug,
                    description: data.description ?? null,
                    avatar: data.avatar ?? null,
                }
            });
    
            await tx.organizationMember.create({
                data: {
                    userId,
                    organizationId: newOrganization.id,
                    role: OrganizationRole.OWNER,
                }
            });
    
            return newOrganization;
        });
    
        return organization;

}

export const getUserOrganizations = async(userId:string)=>{
    const organizations = await prisma.organization.findMany({
        where:{
            isActive:true,
            members:{
                some:{
                    userId : userId,
                },
            },
        },

        select:{
            id:true,
            name:true,
            slug: true,
            description: true,
            avatar: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,

            members:{
                where:{
                    userId,
                },
                select:{
                    joinedAt:true,
                    role:true,
                },
            },
        },

        orderBy:{
            createdAt:"desc"
        }
    });

    return organizations;
}

export const getOrganizationMembers = async (organizationId:string , page:number , limit:number)=>{

    const skip = (page-1)*limit;

    const [members , total] = await prisma.$transaction([
        prisma.organizationMember.findMany({
            where:{
                organizationId : organizationId,
            },

            skip : skip,
            take : limit,

            select:{
                id:true,
                role:true,
                joinedAt:true,
    
                user:{
                    select:{
                        id:true,
                        name:true,
                        username:true,
                        mail:true,
                        avatar:true,
                    },
                },
    
            },
    
            orderBy:{
                joinedAt:'desc',
            }
    
        }),

        prisma.organizationMember.count({
            where:{
                organizationId,
            }
        }),

    ]);


    return {
        members,
        pagination:{
            page,
            limit,
            total,
            totalPages: Math.ceil(total/limit),
        },
    };
};

export const updateMemberRole = async(organizationId:string ,actorUserId:string ,targetUserId:string , newRole:OrganizationRole )=>{
    if(actorUserId === targetUserId){
        throw new ApiErrors(404 , "cannot change your own role");
    }

    const targetMembership = await prisma.organizationMember.findUnique({
        where:{
            organizationId_userId :{
                organizationId,
                userId : targetUserId,
            },
        },
    });

    if(!targetMembership){
        throw new ApiErrors( 404,"Member not found");
    }

    if(targetMembership.role === OrganizationRole.OWNER){
        throw new ApiErrors(403, "The organization owner cannot be modified");
    }

    const actorMembership = await prisma.organizationMember.findUnique({
        where:{
            organizationId_userId:{
                organizationId,
                userId:actorUserId,    
            },
        },
    });

    if (!actorMembership) {
        throw new ApiErrors(403,"Organization membership required" );
    }

    if ( actorMembership.role === OrganizationRole.ADMIN && targetMembership.role === OrganizationRole.ADMIN) {
        throw new ApiErrors( 403, "Admins cannot modify another admin" );
    }

    const updatedMembership = await prisma.organizationMember.update({
        where: {
            id:targetMembership.id,
        },
        data: {
            role: newRole,
        },
        select: {
            id: true,
            role: true,
            joinedAt: true,

            user: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                    email: true,
                    avatar: true
                }
            }
        },
    })

}

export const removeMember = async ( organizationId: string, actorUserId: string,targetUserId: string ) => {
    if (actorUserId === targetUserId) {
        throw new ApiErrors(
            400,
            "You cannot remove yourself from the organization"
        );
    }

    const [actorMembership, targetMembership] =
        await Promise.all([
            prisma.organizationMember.findUnique({
                where: {
                    organizationId_userId: {
                        organizationId,
                        userId: actorUserId
                    }
                },
                select: {
                    role: true
                }
            }),

            prisma.organizationMember.findUnique({
                where: {
                    organizationId_userId: {
                        organizationId,
                        userId: targetUserId
                    }
                },
                select: {
                    id: true,
                    role: true
                }
            })
        ]);

    if (!actorMembership) {
        throw new ApiErrors(
            403,
            "Organization membership required"
        );
    }

    if (!targetMembership) {
        throw new ApiErrors(
            404,
            "Member not found"
        );
    }

    if (targetMembership.role === OrganizationRole.OWNER) {
        throw new ApiErrors(
            403,
            "The organization owner cannot be removed"
        );
    }

    if (
        actorMembership.role === OrganizationRole.ADMIN &&
        targetMembership.role === OrganizationRole.ADMIN
    ) {
        throw new ApiErrors(
            403,
            "Admins cannot remove another admin"
        );
    }

    await prisma.organizationMember.delete({
        where: {
            organizationId_userId: {
                organizationId,
                userId: targetUserId
            }
        }
    });
};

export const  leaveOrganization = async(organizationId:string , userId:string)=>{
    const membership = await prisma.organizationMember.findUnique({
        where:{
            organizationId_userId:{
                organizationId,
                userId,
            },
        },
        select:{
            id:true,
            role:true,
        },
    });

    if(!membership){
        throw new ApiErrors(404 , "Organization membership not found");
    }

    if(membership.role == OrganizationRole.OWNER){
        throw new ApiErrors(403 , "Organization owner cannot leave the organization. Transfer ownership first.");
    }

    await prisma.organizationMember.delete({
        where :{
            id:membership.id
        },
    });
};

export const transferOwnership = async(organizationId:string , currentOwnerId:string , newOwnerId:string)=>{
    if (currentOwnerId === newOwnerId) {
        throw new ApiErrors(400,"You cannot transfer ownership to yourself");
    };

    const targetMembership = await prisma.organizationMember.findUnique({
        where:{
            organizationId_userId:{
                organizationId,
                userId:newOwnerId,
            },
            select:{
                id:true,
                role:true,
            }
        }
    });

    if(!targetMembership){
        throw new ApiErrors(403 , "target member  not found");
    }

    if(targetMembership.role === OrganizationRole.OWNER){
        throw new ApiErrors(400 , "This user is already the owner");
    }

    await prisma.$transaction(async(tx)=>{
        await tx.organizationMember.update({
            where:{
                organizationId_userId:{
                    organizationId,
                    userId:currentOwnerId,
                },
            },
            data:{
                role:OrganizationRole.ADMIN,
            }
        }),

        await tx.organizationMember.update({
            where: {
                organizationId_userId: {
                    organizationId,
                    userId: newOwnerId
                }
            },
            data:{
                role:OrganizationRole.OWNER,
            },
        });
    });

}


