
import prisma from "../../../config/prisma.js";
import { ApiErrors } from "../../../common/errors/ApiErrors.js";

import {CreateBoardColumnInput,UpdateBoardColumnInput,UpdateBoardInput,} from "./boardValidation.js";
import { BoardTasksQuery } from "./boardValidation.js";


// Get project board with paginated tasks

export const getProjectBoard = async (projectId: string,pagination: BoardTasksQuery) => {
  const { page, limit } = pagination;

  const board = await prisma.board.findUnique({
    where: {
      projectId,
    },

    include: {
      columns: {
        orderBy: {
          position: "asc",
        },

        include: {
          tasks: {
            orderBy: {
              position: "asc",
            },

            skip: (page - 1) * limit,
            take: limit,

            select: {
              id: true,
              title: true,
              description: true,
              priority: true,
              startDate: true,
              dueDate: true,
              estimateMinutes: true,
              position: true,
              parentTaskId: true,
              createdById: true,
              createdAt: true,
              updatedAt: true,

              assignees: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },

              labels: {
                include: {
                  label: true,
                },
              },

              _count: {
                select: {
                  subtasks: true,
                  comments: true,
                  attachments: true,
                },
              },
            },
          },

          _count: {
            select: {
              tasks: true,
            },
          },
        },
      },
    },
  });

  if (!board) {
    throw new ApiErrors(404, "Project board not found");
  }

  return {
    id: board.id,
    projectId: board.projectId,
    name: board.name,
    description: board.description,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,

    columns: board.columns.map((column) => ({
      id: column.id,
      name: column.name,
      category: column.category,
      position: column.position,
      isDefault: column.isDefault,
      wipLimit: column.wipLimit,

      tasks: column.tasks,

      pagination: {
        page,
        limit,
        total: column._count.tasks,
        totalPages: Math.ceil(column._count.tasks / limit),
      },
    })),
  };
};



// 2. Update board details

export const updateProjectBoard = async (projectId: string,boardData: UpdateBoardInput) => {

  const board = await prisma.board.findUnique({
    where: {
      projectId,
    },
    select: {
      id: true,
    },
  });

  if (!board) {
    throw new ApiErrors(404, "Project board not found");
  }

  const updatedBoard = await prisma.board.update({
    where: {
      id: board.id,
    },
    data: {
      ...(boardData.name !== undefined && {
        name: boardData.name,
      }),

      ...(boardData.description !== undefined && {
        description: boardData.description,
      }),
    },
  });

  return updatedBoard;
};


// 3. Create board column

export const createBoardColumn = async ( projectId: string, columnData: CreateBoardColumnInput ) => {
    
  return prisma.$transaction(async (tx) => {
    const board = await tx.board.findUnique({
      where: {
        projectId,
      },
      select: {
        id: true,
      },
    });

    if (!board) {
      throw new ApiErrors(404, "Project board not found");
    }

    const lastColumn = await tx.boardColumn.findFirst({
      where: {
        boardId: board.id,
      },
      orderBy: {
        position: "desc",
      },
      select: {
        position: true,
      },
    });

    const position = lastColumn
      ? lastColumn.position + 1
      : 0;

    const column = await tx.boardColumn.create({
      data: {
        boardId: board.id,
        projectId,
        name: columnData.name,
        category: columnData.category,
        wipLimit: columnData.wipLimit ?? null,
        position,
        isDefault: false,
      },
    });

    return column;
  });
};


// 4. Update board column

export const updateBoardColumn = async (
  projectId: string,
  columnId: string,
  columnData: UpdateBoardColumnInput
) => {
  const column = await prisma.boardColumn.findFirst({
    where: {
      id: columnId,
      projectId,
    },
  });

  if (!column) {
    throw new ApiErrors(404, "Board column not found");
  }

  const updatedColumn = await prisma.boardColumn.update({
    where: {
      id: column.id,
    },
    data: {
      ...(columnData.name !== undefined && {
        name: columnData.name,
      }),

      ...(columnData.category !== undefined && {
        category: columnData.category,
      }),

      ...(columnData.wipLimit !== undefined && {
        wipLimit: columnData.wipLimit,
      }),
    },
  });

  return updatedColumn;
};


// 5. Delete board column

export const deleteBoardColumn = async (
  projectId: string,
  columnId: string
) => {
  await prisma.$transaction(async (tx) => {
    const column = await tx.boardColumn.findFirst({
      where: {
        id: columnId,
        projectId,
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (!column) {
      throw new ApiErrors(404, "Board column not found");
    }

    if (column.isDefault) {
      throw new ApiErrors(
        400,
        "Default board columns cannot be deleted"
      );
    }

    if (column._count.tasks > 0) {
      throw new ApiErrors(
        400,
        "Cannot delete a column containing tasks. Move its tasks first."
      );
    }

    await tx.boardColumn.delete({
      where: {
        id: column.id,
      },
    });
  });

  return {
    columnId,
  };
};
