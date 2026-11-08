import { z } from "zod";
import { TaskPriority } from "@prisma/client";

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
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;