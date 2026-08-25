import { z } from "zod";
import { OrganizationVisibility } from "@prisma/client";

export const updateOrganizationSettingsSchema = z.object({
    allowJoinRequests: z.boolean() .optional()
});

export const updateOrganizationVisibilitySchema = z.object({
    visibility: z.nativeEnum(OrganizationVisibility),
});

export type UpdateOrganizationSettingsInput = z.infer<typeof updateOrganizationSettingsSchema>;