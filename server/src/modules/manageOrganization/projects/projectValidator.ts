import {z} from "zod";

export const createProjectSchema = z.object({
    name:z
    .string()
    .trim()
    .min(1,"project name must contain atleast 2 character")
    .max(100, "Project name cannot exceed 100 characters"),

    slug:z
    .string()
    .trim()
    .min(2, "Project slug must contain at least 2 characters")
    .max(100, "Project slug cannot exceed 100 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers and hyphens"),

    description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),

    avatar: z
    .string()
    .url("Avatar must be a valid URL")
    .optional()
    .or(z.literal(""))

})


// type

export type CreateProjectInput = z.infer< typeof createProjectSchema>;