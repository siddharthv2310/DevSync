import { AuthProvider } from "@prisma/client";
import googleClient from "../config/google.js";
import { ApiErrors } from "../common/errors/ApiErrors.js";

export interface OAuthProfile {
    email: string;
    name: string;
    avatar?: string;
    provider: AuthProvider;
    providerId: string;
}

export const verifyGoogleToken = async ( idToken: string ): Promise<OAuthProfile> => {
    
    const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID!,
    });

    const payload = ticket.getPayload();

    if (!payload) {
        throw new ApiErrors(401, "Invalid Google token");
    }

    if (!payload.email || !payload.email_verified) {
        throw new ApiErrors(401, "Google email not verified");
    }

    return {
        email: payload.email,
        name: payload.name ?? "Google User",
        ...(payload.picture ? { avatar: payload.picture } : {}),
        provider: AuthProvider.GOOGLE,
        providerId: payload.sub,
    };
};