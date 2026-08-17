import axios from "axios";
import { OAuthProfile } from "./authType.js";
import { githubConfig } from "../config/github.js";
import { ApiErrors } from "../common/errors/ApiErrors.js";
import { AuthProvider } from "@prisma/client";

export const verifyGithubCode = async (code: string): Promise<OAuthProfile> => {
    try {
        const tokenResponse = await axios.post(
            "https://github.com/login/oauth/access_token",
            {
                client_id: githubConfig.clientId,
                client_secret: githubConfig.clientSecret,
                code,
                redirect_uri: githubConfig.redirectUri,
            },
            {
                headers: {
                    Accept: "application/json",
                },
            }
        );

        const accessToken = tokenResponse.data.access_token;

        if (!accessToken) {
            throw new ApiErrors(401, "Github authentication Failed");
        }

        const userResponse = await axios.get(
            "https://api.github.com/user",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        const emailResponse = await axios.get(
            "https://api.github.com/user/emails",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        const primaryEmail = emailResponse.data.find(
            (email: { primary: boolean; verified: boolean }) =>
                email.primary && email.verified
        );

        if (!primaryEmail) {
            throw new ApiErrors(401, "GitHub email not verified");
        }

        return {
            email: primaryEmail.email,
            name: userResponse.data.name || userResponse.data.login,
            avatar: userResponse.data.avatar_url,
            provider: AuthProvider.GITHUB,
            providerId: String(userResponse.data.id),
        };
    } catch (error) {
        if (error instanceof ApiErrors) {
            throw error;
        }

        throw new ApiErrors(401, "GitHub authentication failed");
    }
};
