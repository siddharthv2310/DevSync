
import { Prisma, projectRole } from "@prisma/client";
import prisma from "../../config/prisma.js";
import { CreateProjectInput } from "./projectValidator.js";
import { ApiErrors } from "../../common/errors/ApiErrors.js";

// Create project
export const createProject = async (organizationId: string,userId: string,projectData: CreateProjectInput ) => {

  try {
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

      // The creator automatically becomes the project OWNER.
      await tx.projectMember.create({
        data: {
          projectId: newProject.id,
          userId,
          role: projectRole.OWNER,
        },
      });

      return newProject;
    });

    return project;
  } 
  catch (error) {
    // Handle duplicate slug, including concurrent creation attempts.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ApiErrors(
        409,
        "A project with this slug already exists in this organization"
      );
    }

    throw error;
  }
};

// Get all projects belonging to an organization
export const getOrganizationProjects = async ( organizationId: string, page: number, limit: number, search?: string, includeArchived: boolean = false ) => {
  const skip = (page - 1) * limit;

  const where: Prisma.ProjectWhereInput = {
    organizationId,

    ...(includeArchived ? {} : { isArchived: false }),

    ...(search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              slug: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  const [projects, total] = await prisma.$transaction([
    prisma.project.findMany({
      where,
      skip,
      take: limit,
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
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.project.count({ where }),
  ]);

  return {
    projects: projects.map((project) => ({
      ...project,
      memberCount: project._count.members,
      _count: undefined,
    })),

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get project details
export const getProjectDetails = async (projectId: string) => {
    
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
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
          members: true,
        },
      },
    },
  });

  if (!project) {
    throw new ApiErrors(404, "Project not found");
  }

  return {
    ...project,
    memberCount: project._count.members,
    _count: undefined,
  };
};
