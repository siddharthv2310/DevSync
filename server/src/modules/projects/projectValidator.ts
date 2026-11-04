import { z } from "zod";

export const createProjectSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Project name must contain at least 2 characters")
        .max(100, "Project name cannot exceed 100 characters"),

    slug: z
        .string()
        .trim()
        .min(2, "Project slug must contain at least 2 characters")
        .max(100, "Project slug cannot exceed 100 characters")
        .regex(
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            "Slug can contain lowercase letters, numbers, and single hyphens"
        ),

    description: z
        .string()
        .trim()
        .max(500, "Description cannot exceed 500 characters")
        .optional(),

    avatar: z
        .string()
        .url("Avatar must be a valid URL")
        .or(z.literal(""))
        .optional()
        .transform((value) => value || undefined),
});

export const getProjectsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(50).default(20),

    search: z
        .string()
        .trim()
        .max(100, "Search cannot exceed 100 characters")
        .optional(),

    includeArchived: z
        .union([
            z.boolean(),
            z.enum(["true", "false"]).transform((value) => value === "true"),
        ])
        .default(false),
});


export const updateProjectSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Project name must contain at least 2 characters")
        .max(100, "Project name cannot exceed 100 characters")
        .optional(),

    slug: z
        .string()
        .trim()
        .min(2, "Project slug must contain at least 2 characters")
        .max(100, "Project slug cannot exceed 100 characters")
        .regex(
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            "Slug can contain lowercase letters, numbers, and single hyphens"
        )
        .optional(),

    description: z
        .string()
        .trim()
        .max(500, "Description cannot exceed 500 characters")
        .nullable()
        .optional(),

    avatar: z
        .union([
            z.string().url("Avatar must be a valid URL"),
            z.literal(""),
            z.null(),
        ])
        .optional()
        .transform((value) => (value === "" ? null : value)),
})
    .strict().refine(
        (data) => Object.keys(data).length > 0,
        "At least one field must be provided to update the project"
    );

export const projectIdParamSchema = z.object({
    projectId: z.string().uuid("Invalid project ID"),
});


export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export type GetProjectQuery = z.infer<typeof getProjectsQuerySchema>;