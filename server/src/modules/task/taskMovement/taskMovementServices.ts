
import { Prisma } from "@prisma/client";

import prisma from "../../../config/prisma.js";
import { ApiErrors } from "../../../common/errors/ApiErrors.js";

import { MoveTaskInput } from "./taskMovementValidation.js";

interface MoveTaskServiceInput {
  projectId: string;
  taskId: string;
  userId: string;
  canManageAnyTask: boolean;
  data: MoveTaskInput;
}

const MAX_RETRIES = 3;

// Move or reorder task

export const moveTask = async (input: MoveTaskServiceInput) => {
  const executeMovement = async () => {
    return prisma.$transaction(
      async (tx) => {
        // 1. Find the task
        const task = await tx.task.findFirst({
          where: {
            id: input.taskId,
            projectId: input.projectId,
          },
          include: {
            assignees: {
              select: {
                userId: true,
              },
            },
          },
        });

        if (!task) {
          throw new ApiErrors(404, "Task not found");
        }

        // 2. Check task management permission
        if (!input.canManageAnyTask) {
          const isCreator = task.createdById === input.userId;

          const isAssignee = task.assignees.some(
            (assignee) => assignee.userId === input.userId
          );

          if (!isCreator && !isAssignee) {
            throw new ApiErrors(
              403,
              "You cannot move this task"
            );
          }
        }

        // 3. Verify target column belongs to this project
        const targetColumn = await tx.boardColumn.findFirst({
          where: {
            id: input.data.targetColumnId,
            projectId: input.projectId,
          },
          select: {
            id: true,
            wipLimit: true,
          },
        });

        if (!targetColumn) {
          throw new ApiErrors(
            404,
            "Target board column not found"
          );
        }

        const sourceColumnId = task.columnId;
        const targetColumnId = targetColumn.id;

        const isSameColumn = sourceColumnId === targetColumnId;

        // 4. Fetch source column tasks
        const sourceTasks = await tx.task.findMany({
          where: {
            projectId: input.projectId,
            columnId: sourceColumnId,
          },
          orderBy: [
            { position: "asc" },
            { createdAt: "asc" },
            { id: "asc" },
          ],
          select: {
            id: true,
            position: true,
          },
        });

        // 5. Fetch target column tasks if moving
        const targetTasks = isSameColumn
          ? sourceTasks
          : await tx.task.findMany({
              where: {
                projectId: input.projectId,
                columnId: targetColumnId,
              },
              orderBy: [
                { position: "asc" },
                { createdAt: "asc" },
                { id: "asc" },
              ],
              select: {
                id: true,
                position: true,
              },
            });

        // 6. Remove moving task from source list
        const remainingSourceTasks = sourceTasks.filter(
          (item) => item.id !== task.id
        );

        // 7. Check WIP limit when moving to another column
        if (!isSameColumn && targetColumn.wipLimit !== null) {
          if (targetTasks.length >= targetColumn.wipLimit) {
            throw new ApiErrors(
              400,
              "Target column has reached its WIP limit"
            );
          }
        }

        // 8. Validate requested position
        const targetList = isSameColumn
          ? remainingSourceTasks
          : [...targetTasks];

        if (input.data.position > targetList.length) {
          throw new ApiErrors(
            400,
            "Invalid task position"
          );
        }

        // 9. Insert task at requested position
        targetList.splice(input.data.position, 0, {
          id: task.id,
          position: input.data.position,
        });

        // 10. Persist source column positions
        if (!isSameColumn) {
          for (let index = 0; index < remainingSourceTasks.length; index++) {
            await tx.task.update({
              where: {
                id: remainingSourceTasks[index]?.id as string,
              },
              data: {
                position: index,
              },
            });
          }
        }

        // 11. Persist target column positions
        for (let index = 0; index < targetList.length; index++) {
          await tx.task.update({
            where: {
              id: targetList[index]?.id as string,
            },
            data: {
              columnId: targetColumnId,
              position: index,
            },
          });
        }

        return {
          taskId: task.id,
          sourceColumnId,
          targetColumnId,
          position: input.data.position,
          moved: !isSameColumn,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );
  };

  // 12. Retry serialization conflicts
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await executeMovement();
    } catch (error) {
      const isSerializationConflict =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034";

      if (isSerializationConflict && attempt < MAX_RETRIES) {
        continue;
      }

      if (isSerializationConflict) {
        throw new ApiErrors(
          409,
          "Task movement conflicted with another operation. Please retry."
        );
      }

      throw error;
    }
  }

  throw new ApiErrors(409, "Unable to move task");
};
