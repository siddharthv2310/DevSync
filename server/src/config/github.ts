export const githubConfig = {
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    redirectUri: `${process.env.BACKEND_URL}/api/v1/auth/oauth/github/callback`,
};
