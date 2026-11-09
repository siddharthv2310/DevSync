import { z } from "zod";
import { TaskPriority, BoardColumnCategory } from "@prisma/client";


// Validate project and task IDs
export const taskParamsSchema = z.object({
    projectId: z.string().uuid("Invalid project ID"),
    taskId: z.string().uuid("Invalid task ID").optional(),
});

// Create task
export const createTaskSchema = z.object({
    columnId: z.string().uuid("Invalid column ID"),

    title: z.string()
        .trim()
        .min(1, "Task title is required")
        .max(200, "Task title cannot exceed 200 characters"),

    description: z.string()
        .trim()
        .max(10000, "Description is too long")
        .nullable()
        .optional(),

    priority: z.nativeEnum(TaskPriority).optional(),

    startDate: z.coerce.date().nullable().optional(),

    dueDate: z.coerce.date().nullable().optional(),

    estimateMinutes: z.number()
        .int("Estimate must be an integer")
        .positive("Estimate must be greater than zero")
        .max(525600, "Estimate is too large")
        .nullable()
        .optional(),
}).refine(
    (data) =>
        !data.startDate ||
        !data.dueDate ||
        data.startDate <= data.dueDate,
    {
        message: "Start date cannot be after due date",
        path: ["dueDate"],
    }
);

// Update task
export const updateTaskSchema = z.object({
    title: z.string()
        .trim()
        .min(1, "Task title cannot be empty")
        .max(200, "Task title cannot exceed 200 characters")
        .optional(),

    description: z.string()
        .trim()
        .max(10000, "Description is too long")
        .nullable()
        .optional(),

    priority: z.nativeEnum(TaskPriority).optional(),

    startDate: z.coerce.date().nullable().optional(),

    dueDate: z.coerce.date().nullable().optional(),

    estimateMinutes: z.number()
        .int("Estimate must be an integer")
        .positive("Estimate must be greater than zero")
        .max(525600, "Estimate is too large")
        .nullable()
        .optional(),
})
    .refine(
        (data) => Object.keys(data).length > 0,
        {
            message: "At least one field must be provided",
        }
    )
    .refine(
        (data) =>
            !data.startDate ||
            !data.dueDate ||
            data.startDate <= data.dueDate,
        {
            message: "Start date cannot be after due date",
            path: ["dueDate"],
        }
    );

// List tasks

export const listTasksQuerySchema = z.object({
    // Pagination
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),

    // Search
    search: z.string().trim().max(200).optional(),

    // Filters
    priority: z.nativeEnum(TaskPriority).optional(),
    status: z.nativeEnum(BoardColumnCategory).optional(),
    assigneeId: z.string().uuid().optional(),
    columnId: z.string().uuid().optional(),

    // Date filters
    startDateFrom: z.coerce.date().optional(),
    startDateTo: z.coerce.date().optional(),
    dueDateFrom: z.coerce.date().optional(),
    dueDateTo: z.coerce.date().optional(),

    // Overdue filter
    overdue: z.enum(["true", "false"])
        .transform((value) => value === "true")
        .optional(),

    // Sorting
    sortBy: z.enum([
        "createdAt",
        "updatedAt",
        "dueDate",
        "startDate",
        "title",
        "priority",
        "position",
    ]).default("createdAt"),

    sortOrder: z.enum(["asc", "desc"]).default("desc"),
}).refine(
    (data) =>
        !data.startDateFrom ||
        !data.startDateTo ||
        data.startDateFrom <= data.startDateTo,
    {
        message: "Start date range is invalid",
        path: ["startDateTo"],
    }
).refine(
    (data) =>
        !data.dueDateFrom ||
        !data.dueDateTo ||
        data.dueDateFrom <= data.dueDateTo,
    {
        message: "Due date range is invalid",
        path: ["dueDateTo"],
    }
);


export const taskAssigneeParamsSchema = z.object({
    projectId: z.string().uuid("Invalid project ID"),
    taskId: z.string().uuid("Invalid task ID"),
    userId: z.string().uuid("Invalid user ID").optional(),
});

export const assignTaskUserSchema = z.object({
    userId: z.string().uuid("Invalid user ID"),
});



export const createTaskLabelSchema = z.object({
    name: z.string().trim().min(1).max(50),
    color: z.string()
        .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color")
        .nullable()
        .optional(),
});

export const updateTaskLabelSchema = z.object({
    name: z.string().trim().min(1).max(50).optional(),
    color: z.string()
        .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color")
        .nullable()
        .optional(),
}).refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one field must be provided" }
);

export const taskLabelParamsSchema = z.object({
    projectId: z.string().uuid(),
    taskId: z.string().uuid().optional(),
    labelId: z.string().uuid().optional(),
});

export const assignTaskLabelSchema = z.object({
    labelId: z.string().uuid(),
});


// Create a subtask (inherits its parent's column)
export const createSubtaskSchema = z.object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(10000).nullable().optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    startDate: z.coerce.date().nullable().optional(),
    dueDate: z.coerce.date().nullable().optional(),
    estimateMinutes: z.number().int().positive().max(525600).nullable().optional(),
  }).refine(
    (data) =>
      !data.startDate ||
      !data.dueDate ||
      data.startDate <= data.dueDate,
    {
      message: "Start date cannot be after due date",
      path: ["dueDate"],
    }
  );
  
  // Add a dependency: the supplied task must block the task in the URL.

  export const createTaskDependencySchema = z.object({
    blockingTaskId: z.string().uuid("Invalid blocking task ID"),
  });
  
  export const subtaskParamsSchema = z.object({
    projectId: z.string().uuid(),
    taskId: z.string().uuid(),
  });
  
  export const taskDependencyParamsSchema = z.object({
    projectId: z.string().uuid(),
    taskId: z.string().uuid(),
    blockingTaskId: z.string().uuid(),
  });
  
export type CreateSubtaskInput = z.infer<typeof createSubtaskSchema>;
export type CreateTaskDependencyInput = z.infer<typeof createTaskDependencySchema>;
export type CreateTaskLabelInput = z.infer<typeof createTaskLabelSchema>;
export type UpdateTaskLabelInput = z.infer<typeof updateTaskLabelSchema>;
export type AssignTaskUserInput = z.infer<typeof assignTaskUserSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;