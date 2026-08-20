import { OrganizationRole } from "@prisma/client";
import prisma from "../../config/prisma.js"
import { createOrganisationinput } from "./organizationvalidation.js";
import { ApiErrors } from "../../common/errors/ApiErrors.js";

// interface createOrganisationData{
//     name:string ,
//     slug:string ,
//     description?:string ,
//     avatar?:string ,
// }

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

