import prisma from "../../config/prisma.js";
import { ApiErrors } from "../../common/errors/ApiErrors.js";

// Check whether the current user can manage assignments on this task.
const checkTaskAssignmentAccess = async (
  projectId: string,
  taskId: string,
  userId: string,
  canManageAnyTask: boolean
) => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      projectId,
    },
    select: {
      id: true,
      createdById: true,
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

  if (canManageAnyTask) {
    return task;
  }

  const isCreator = task.createdById === userId;
  const isAssignee = task.assignees.some(
    (assignee) => assignee.userId === userId
  );

  if (!isCreator && !isAssignee) {
    throw new ApiErrors(
      403,
      "You can only manage assignments on tasks you created or are assigned to"
    );
  }

  return task;
};

// ASSIGN USER TO TASK
export const assignUserToTask = async (
  projectId: string,
  taskId: string,
  targetUserId: string,
  currentUserId: string,
  canManageAnyTask: boolean
) => {
  return prisma.$transaction(async (tx) => {
    await checkTaskAssignmentAccess(
      projectId,
      taskId,
      currentUserId,
      canManageAnyTask
    );

    // Only actual project members can be assigned to project tasks.
    const projectMember = await tx.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUserId,
        },
      },
      select: {
        userId: true,
      },
    });

    if (!projectMember) {
      throw new ApiErrors(
        400,
        "The selected user is not a member of this project"
      );
    }

    // Check whether this user is already assigned.
    const existingAssignment = await tx.taskAssignee.findUnique({
      where: {
        taskId_userId: {
          taskId,
          userId: targetUserId,
        },
      },
    });

    if (existingAssignment) {
      throw new ApiErrors(409, "User is already assigned to this task");
    }

    const assignment = await tx.taskAssignee.create({
      data: {
        taskId,
        userId: targetUserId,
      },
      select: {
        taskId: true,
        assignedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return assignment;
  });
};

// REMOVE USER FROM TASK
export const removeUserFromTask = async (
  projectId: string,
  taskId: string,
  targetUserId: string,
  currentUserId: string,
  canManageAnyTask: boolean
) => {
  return prisma.$transaction(async (tx) => {
    await checkTaskAssignmentAccess(
      projectId,
      taskId,
      currentUserId,
      canManageAnyTask
    );

    const assignment = await tx.taskAssignee.findUnique({
      where: {
        taskId_userId: {
          taskId,
          userId: targetUserId,
        },
      },
      select: {
        taskId: true,
        userId: true,
      },
    });

    if (!assignment) {
      throw new ApiErrors(404, "User is not assigned to this task");
    }

    await tx.taskAssignee.delete({
      where: {
        taskId_userId: {
          taskId,
          userId: targetUserId,
        },
      },
    });

    return {
      taskId,
      userId: targetUserId,
      removed: true,
    };
  });
};

// GET TASK ASSIGNEES
export const getTaskAssignees = async (
  projectId: string,
  taskId: string
) => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      projectId,
    },
    select: {
      id: true,
      assignees: {
        orderBy: {
          assignedAt: "asc",
        },
        select: {
          assignedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              avatar: true,
            },
          },
        },
      },
    },
  });

  if (!task) {
    throw new ApiErrors(404, "Task not found");
  }

  return task.assignees;
};