import { projectRole } from "@prisma/client";
import prisma from "../../../config/prisma.js";
import { CreateProjectInput } from "./projectValidator.js";
import { ApiErrors } from "../../../common/errors/ApiErrors.js";


export const createProject = async(organizationId:string , userId:string , projectData:CreateProjectInput)=>{

    const existingProject = await prisma.project.findUnique({
        where:{
            organizationId_slug:{
                organizationId,
                slug:projectData.slug,
            },
        },
    });

    if(existingProject){
        throw new ApiErrors(409 ,  "A project with this slug already exists in this organization");
    }

    const project = await prisma.$transaction(async(tx)=>{
        const newProject = await tx.project.create({
            data:{
                organizationId,
                name:projectData.name,
                slug:projectData.slug,
                description:projectData.description ?? null,
                avatar:projectData.avatar ?? null,
            },
        });

        const newProjectMember = await tx.projectMember.create({
            data: {
                projectId: newProject.id,
                userId,
                role: projectRole.OWNER
            },
        });

        return newProject
    })

    return project;
}