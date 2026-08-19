import { OrganizationRole } from "@prisma/client";
import prisma from "../../config/prisma.js"

interface createOrganisationData{
    name:string ,
    slug:string ,
    description?:string ,
    avatar?:string ,
}

export const createOrganisation = async( userId:string , data:createOrganisationData)=>{
    try{
        const existingOrganisation = await prisma.organization.findUnique({
            where:{
                slug : data.slug,
            },
        });

        if(existingOrganisation){
            throw new Error("Organisation with this slug already exists");
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
    catch(error){
        throw new Error("Failed to create organisation");
    }

}

