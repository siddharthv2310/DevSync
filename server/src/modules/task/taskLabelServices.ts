import { Prisma } from "@prisma/client";
import prisma from "../../config/prisma.js";
import { ApiErrors } from "../../common/errors/ApiErrors.js";
import {CreateTaskLabelInput,UpdateTaskLabelInput,} from "./taskValidator.js";

// Check whether the current user can manage labels on this task.
// OWNER/ADMIN can manage any task; MEMBER must be creator or assignee.

const checkTaskLabelAccess = async (
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
      "You can only manage labels on tasks you created or are assigned to"
    );
  }

  return task;
};

// CREATE PROJECT LABEL
export const createTaskLabel = async (
  projectId: string,
  data: CreateTaskLabelInput
) => {
  const existingLabel = await prisma.taskLabel.findUnique({
    where: {
      projectId_name: {
        projectId,
        name: data.name,
      },
    },
  });

  if (existingLabel) {
    throw new ApiErrors(409, "A label with this name already exists");
  }

  return prisma.taskLabel.create({
    data: {
      projectId,
      name: data.name,
      color: data.color ?? null,
    },
    select: {
      id: true,
      projectId: true,
      name: true,
      color: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

// GET PROJECT LABELS
export const getProjectTaskLabels = async (projectId: string) => {
  return prisma.taskLabel.findMany({
    where: { projectId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      projectId: true,
      name: true,
      color: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { tasks: true },
      },
    },
  });
};

// UPDATE PROJECT LABEL
export const updateTaskLabel = async (
  projectId: string,
  labelId: string,
  data: UpdateTaskLabelInput
) => {
  const existingLabel = await prisma.taskLabel.findFirst({
    where: {
      id: labelId,
      projectId,
    },
    select: { id: true },
  });

  if (!existingLabel) {
    throw new ApiErrors(404, "Label not found");
  }

  if (data.name !== undefined) {
    const duplicate = await prisma.taskLabel.findUnique({
      where: {
        projectId_name: {
          projectId,
          name: data.name,
        },
      },
    });

    if (duplicate && duplicate.id !== labelId) {
      throw new ApiErrors(409, "A label with this name already exists");
    }
  }

  return prisma.taskLabel.update({
    where: { id: labelId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.color !== undefined && { color: data.color }),
    },
    select: {
      id: true,
      projectId: true,
      name: true,
      color: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

// DELETE PROJECT LABEL
export const deleteTaskLabel = async (
  projectId: string,
  labelId: string
) => {
  return prisma.$transaction(async (tx) => {
    const label = await tx.taskLabel.findFirst({
      where: {
        id: labelId,
        projectId,
      },
      select: { id: true },
    });

    if (!label) {
      throw new ApiErrors(404, "Label not found");
    }

    // Remove task-label links before deleting the shared label.
    await tx.taskLabelAssignment.deleteMany({
      where: { labelId },
    });

    await tx.taskLabel.delete({
      where: { id: labelId },
    });

    return {
      id: labelId,
      deleted: true,
    };
  });
};

// ASSIGN LABEL TO TASK
export const assignLabelToTask = async (
  projectId: string,
  taskId: string,
  labelId: string,
  userId: string,
  canManageAnyTask: boolean
) => {
  return prisma.$transaction(async (tx) => {
    await checkTaskLabelAccess(
      tx,
      projectId,
      taskId,
      userId,
      canManageAnyTask
    );

    const label = await tx.taskLabel.findFirst({
      where: {
        id: labelId,
        projectId,
      },
      select: { id: true },
    });

    if (!label) {
      throw new ApiErrors(404, "Label not found in this project");
    }

    const existing = await tx.taskLabelAssignment.findUnique({
      where: {
        taskId_labelId: {
          taskId,
          labelId,
        },
      },
    });

    if (existing) {
      throw new ApiErrors(409, "Label is already assigned to this task");
    }

    return tx.taskLabelAssignment.create({
      data: {
        taskId,
        labelId,
      },
      select: {
        taskId: true,
        label: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });
  });
};

// REMOVE LABEL FROM TASK
export const removeLabelFromTask = async (
  projectId: string,
  taskId: string,
  labelId: string,
  userId: string,
  canManageAnyTask: boolean
) => {
  return prisma.$transaction(async (tx) => {
    await checkTaskLabelAccess(
      tx,
      projectId,
      taskId,
      userId,
      canManageAnyTask
    );

    const assignment = await tx.taskLabelAssignment.findUnique({
      where: {
        taskId_labelId: {
          taskId,
          labelId,
        },
      },
    });

    if (!assignment) {
      throw new ApiErrors(404, "Label is not assigned to this task");
    }

    await tx.taskLabelAssignment.delete({
      where: {
        taskId_labelId: {
          taskId,
          labelId,
        },
      },
    });

    return {
      taskId,
      labelId,
      removed: true,
    };
  });
};