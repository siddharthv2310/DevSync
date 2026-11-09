import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma.js";
import { ApiErrors } from "../../common/errors/ApiErrors.js";
import { CreateSubtaskInput } from "./taskValidator.js";

const subtaskSelect = {
  id: true,
  projectId: true,
  columnId: true,
  parentTaskId: true,
  title: true,
  description: true,
  priority: true,
  startDate: true,
  dueDate: true,
  estimateMinutes: true,
  position: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  createdBy: {
    select: {
      id: true,
      name: true,
      username: true,
      avatar: true,
    },
  },
  column: {
    select: {
      id: true,
      name: true,
      category: true,
    },
  },
} satisfies Prisma.TaskSelect;

const checkTaskAccess = async (
  tx: Prisma.TransactionClient,
  projectId: string,
  taskId: string,
  userId: string,
  canManageAnyTask: boolean
) => {
  const task = await tx.task.findFirst({
    where: { id: taskId, projectId },
    select: {
      id: true,
      parentTaskId: true,
      columnId: true,
      createdById: true,
      assignees: {
        select: { userId: true },
      },
    },
  });

  if (!task) {
    throw new ApiErrors(404, "Task not found");
  }

  if (canManageAnyTask) return task;

  const isCreator = task.createdById === userId;
  const isAssignee = task.assignees.some(
    (assignee) => assignee.userId === userId
  );

  if (!isCreator && !isAssignee) {
    throw new ApiErrors(
      403,
      "You can only manage subtasks of tasks you created or are assigned to"
    );
  }

  return task;
};

// CREATE SUBTASK
export const createSubtask = async (
  projectId: string,
  parentTaskId: string,
  userId: string,
  canManageAnyTask: boolean,
  data: CreateSubtaskInput
) => {
  return prisma.$transaction(async (tx) => {
    const parentTask = await checkTaskAccess(
      tx,
      projectId,
      parentTaskId,
      userId,
      canManageAnyTask
    );

    // Enforce one-level nesting.
    if (parentTask.parentTaskId !== null) {
      throw new ApiErrors(
        400,
        "A subtask cannot have its own subtasks"
      );
    }

    const lastSubtask = await tx.task.aggregate({
      where: {
        projectId,
        parentTaskId,
      },
      _max: {
        position: true,
      },
    });

    const subtask = await tx.task.create({
      data: {
        projectId,
        parentTaskId,
        columnId: parentTask.columnId,
        title: data.title,
        description: data.description ?? null,
        priority: data.priority ?? "MEDIUM",
        startDate: data.startDate ?? null,
        dueDate: data.dueDate ?? null,
        estimateMinutes: data.estimateMinutes ?? null,
        position: (lastSubtask._max.position ?? -1) + 1,
        createdById: userId,
      },
      select: subtaskSelect,
    });

    return subtask;
  });
};

// GET SUBTASKS
export const getTaskSubtasks = async (
  projectId: string,
  parentTaskId: string
) => {
  const parentTask = await prisma.task.findFirst({
    where: {
      id: parentTaskId,
      projectId,
      parentTaskId: null,
    },
    select: { id: true },
  });

  if (!parentTask) {
    throw new ApiErrors(404, "Top-level task not found");
  }

  return prisma.task.findMany({
    where: {
      projectId,
      parentTaskId,
    },
    select: subtaskSelect,
    orderBy: [
      { position: "asc" },
      { createdAt: "asc" },
    ],
  });
};