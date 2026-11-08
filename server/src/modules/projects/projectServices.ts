
import { OrganizationRole, Prisma, projectRole } from "@prisma/client";
import prisma from "../../config/prisma.js";
import { CreateProjectInput, UpdateProjectInput } from "./projectValidator.js";
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


export const updateProject = async (organizationId: string,projectId: string,updateData: UpdateProjectInput) => {

    try {
      // Build update data using only fields provided by the client.
      const data: Prisma.ProjectUpdateInput = {
        ...(updateData.name !== undefined && {
          name: updateData.name,
        }),
  
        ...(updateData.slug !== undefined && {
          slug: updateData.slug,
        }),
  
        ...(updateData.description !== undefined && {
          description: updateData.description,
        }),
  
        ...(updateData.avatar !== undefined && {
          avatar: updateData.avatar,
        }),
      };
  
      const updatedProject = await prisma.project.update({
        where: {
          id: projectId,
          organizationId,
          isArchived: false,
        },
        data,
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
        },
      });
  
      return updatedProject;
  
    } 
    catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError
      ) {
        // Duplicate slug
        if (error.code === "P2002") {
          throw new ApiErrors(
            409,
            "A project with this slug already exists in this organization"
          );
        }
  
        // Project not found, belongs to another organization,
        // or is archived.
        if (error.code === "P2025") {
          const existingProject = await prisma.project.findFirst({
            where: {
              id: projectId,
              organizationId,
            },
            select: {
              id: true,
              isArchived: true,
            },
          });
  
          if (!existingProject) {
            throw new ApiErrors(404, "Project not found");
          }
  
          if (existingProject.isArchived) {
            throw new ApiErrors(
              403,
              "Archived projects cannot be updated. Restore the project first."
            );
          }
        }
      }
  
      throw error;
    }
  };



export const archiveProject = async ( organizationId: string, projectId: string ) => {

    try {
      const archivedProject = await prisma.project.update({
        where: {
          id: projectId,
          organizationId,
          isArchived: false,
        },
        data: {
          isArchived: true,
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
        },
      });
  
      return archivedProject;
    } 
    catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        // Distinguish an already archived project from a missing project.
        const existingProject = await prisma.project.findFirst({
          where: {
            id: projectId,
            organizationId,
          },
          select: {
            id: true,
            isArchived: true,
          },
        });
  
        if (!existingProject) {
          throw new ApiErrors(404, "Project not found");
        }
  
        if (existingProject.isArchived) {
          throw new ApiErrors(409, "Project is already archived");
        }
      }
  
      throw error;
    }
  };
  


export const restoreProject = async (organizationId: string,projectId: string ) => {
    try {
      const restoredProject = await prisma.project.update({
        where: {
          id: projectId,
          organizationId,
          isArchived: true,
        },
        data: {
          isArchived: false,
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
        },
      });
  
      return restoredProject;
    } 
    catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        const existingProject = await prisma.project.findFirst({
          where: {
            id: projectId,
            organizationId,
          },
          select: {
            id: true,
            isArchived: true,
          },
        });
  
        if (!existingProject) {
          throw new ApiErrors(404, "Project not found");
        }
  
        if (!existingProject.isArchived) {
          throw new ApiErrors(409, "Project is already active");
        }
      }
  
      throw error;
    }
  };
  
  
  // Permanently delete an archived project
  export const deleteProject = async ( organizationId: string, projectId: string, userId: string ) => {

    try {
      return await prisma.$transaction(
        async (tx) => {
          // 1. Verify organization OWNER permission.
          const organizationMember = await tx.organizationMember.findUnique({
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
  
          if (!organizationMember) {
            throw new ApiErrors(
              403,
              "Organization membership required"
            );
          }
  
          if (
            organizationMember.role !== OrganizationRole.OWNER
          ) {
            throw new ApiErrors(
              403,
              "Only the organization OWNER can permanently delete a project"
            );
          }
  
          // 2. Find the project and its conversation IDs.
          const project = await tx.project.findFirst({
            where: {
              id: projectId,
              organizationId,
            },
            select: {
              id: true,
              name: true,
              isArchived: true,
              conversations: {
                select: {
                  id: true,
                },
              },
            },
          });
  
          if (!project) {
            throw new ApiErrors(404, "Project not found");
          }
  
          // 3. Require archival before permanent deletion.
          if (!project.isArchived) {
            throw new ApiErrors(
              409,
              "Archive the project before permanently deleting it"
            );
          }
  
          const conversationIds = project.conversations.map(
              (conversation) => conversation.id
            );
  
          if (conversationIds.length > 0) {
            // 4. Collect S3 keys from existing message attachments.
            const messageAttachments = await tx.messageAttachment.findMany({
                where: {
                  message: {
                    conversationId: {
                      in: conversationIds,
                    },
                  },
                },
                select: {
                  storageKey: true,
                },
              });
  
            // 5. Collect S3 keys from pending/completed uploads too.
            const attachmentUploads = await tx.attachmentUpload.findMany({
                where: {
                  conversationId: {
                    in: conversationIds,
                  },
                },
                select: {
                  storageKey: true,
                },
              });
  
            const storageKeys = [
              ...new Set([
                ...messageAttachments.map(
                  (attachment) => attachment.storageKey
                ),
                ...attachmentUploads.map(
                  (upload) => upload.storageKey
                ),
              ]),
            ];
  
            // 6. Persist cleanup jobs before deleting the project.
            if (storageKeys.length > 0) {
              await tx.storageDeletionJob.createMany({
                data: storageKeys.map((storageKey) => ({
                  storageKey,
                })),
                skipDuplicates: true,
              });
            }
          }
  
          // 7. Permanently delete the project.
          // Related project members and conversations are
          // removed through Prisma/database cascade relations.
          await tx.project.delete({
            where: {
              id: projectId,
            },
          });
  
          return {
            id: project.id,
            name: project.name,
            deleted: true,
          };
        },
        {
          maxWait: 5000,
          timeout: 15000,
        }
      );
    } 
    catch (error) {
      throw error;
    }
  };
  

  