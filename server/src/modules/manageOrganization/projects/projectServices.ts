import { projectRole, Prisma } from "@prisma/client";
import prisma from "../../../config/prisma.js";
import { CreateProjectInput } from "./projectValidator.js";
import { ApiErrors } from "../../../common/errors/ApiErrors.js";


export const createProject = async (organizationId: string, userId: string, projectData: CreateProjectInput) => {

    const existingProject = await prisma.project.findUnique({
        where: {
            organizationId_slug: {
                organizationId,
                slug: projectData.slug,
            },
        },
    });

    if (existingProject) {
        throw new ApiErrors(409, "A project with this slug already exists in this organization");
    }

    const project = await prisma.$transaction(async (tx) => {
        const newProject = await tx.project.create({
            data: {
                organizationId,
                name: projectData.name,
                slug: projectData.slug,
                description: projectData.description ?? null,
                avatar: projectData.avatar ?? null,
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

export const getOrganizationProjects = async (organizationId: string, page: number, limit: number, search?: string, includeArchieved: boolean = false) => {
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = {
        organizationId,

        ...(includeArchieved
            ? {}
            : {
                isArchieved: false,
            }),

        ...(search
            ? {
                or: [
                    {
                        name: {
                            contain: search,
                            mode: "insensitive",
                        }
                    },
                    {
                        slug: {
                            contain: search,
                            mode: "insensitive",
                        }
                    }
                ]

            }

            : {}
        )
    };

    const [projects, total] = await prisma.$transaction([
        prisma.project.findMany({
            where,
            skip,
            take: limit,

            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                avatar: true,
                isArchived: true,
                createdAt: true,
                updatedAt: true,

                _count: {
                    select: {
                        members: true,
                    }
                }
            },

            orderBy: {
                createdAt: "desc"
            },
        }),

        prisma.project.count({
            where,
        })
    ]);

    return {
        projects: projects.map((project) => ({
            ...project,
            memberCount: project._count.members
        })),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        },
    };
};

export const getProjectDetails = async (projectId: string) => {

    const project =
        await prisma.project.findUnique({
            where: {
                id: projectId
            },

            select: {
                id: true,
                organizationId: true,
                name: true,
                slug: true,
                description: true,
                avatar: true,
                isArchived: true,
                createdAt: true,
                updatedAt: true,

                _count: {
                    select: {
                        members: true
                    }
                }
            }
        });

    if (!project) {
        throw new ApiErrors(
            404,
            "Project not found"
        );
    }

    return {
        ...project,
        memberCount: project._count.members
    };
};
