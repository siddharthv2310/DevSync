import { z } from "zod";

export const discoverOrganizationsSchema = z.object({
    search: z
        .string()
        .trim()
        .min(1)
        .max(100)
        .optional(),

    page: z.coerce
        .number()
        .int()
        .min(1)
        .default(1),

    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(50)
        .default(20),
});

export const organizationSlugSchema = z.object({
    slug: z
        .string()
        .trim()
        .min(1)
        .max(100)
        .regex(
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            "Invalid organization slug"
        )
});

export type DiscoverOrganizationsInput = z.infer< typeof discoverOrganizationsSchema>;