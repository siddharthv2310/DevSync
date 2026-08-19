import {z} from "zod";

export const createOrganizationSchema = z.object({
    name:z
    .string()
    .trim()
    .min(2,"Organization name must be at least 2 characters long")
    .max(50,"Organization name must be less than 50 characters long"),

    slug:z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(50, "Slug must not exceed 50 characters")
    .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug can only contain lowercase letters, numbers and hyphens"
    ),

    discription : z
    .string()
    .trim()
    .max(1000,"Description must not exceed 1000 characters")
    .optional(),

    avatar:z
    .string()
    .trim()
    .url("Avatar must be a valid URL")
    .optional(),
})

