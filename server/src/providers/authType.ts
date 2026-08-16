import { AuthProvider } from "@prisma/client";

export interface OAuthProfile {
    email: string;
    name: string;
    avatar?: string;
    provider: AuthProvider;
    providerId: string;
  }