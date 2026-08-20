import { OrganizationRole } from "@prisma/client";

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
            };
            organization?: {
                id: string;
                name: string;
                slug: string;
                description: string | null;
                avatar: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
            
            organizationMember?: {
                id: string;
                userId: string;
                organizationId: string;
                role: OrganizationRole;
                joinedAt: Date;
            };
        }
    }
}