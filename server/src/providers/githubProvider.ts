import axios from "axios";
import { OAuthProfile } from "./authType.js";
import { githubConfig } from "../config/github.js";
import { ApiErrors } from "../common/errors/ApiErrors.js";
import { AuthProvider } from "@prisma/client";

export const verifyGithubCode = async(code : string) : Promise<OAuthProfile>  =>{

    // first step : exchange code for access token;
    try{
        const tokenResponse = await axios.post(
            "https://github.com/login/oauth/access_token",
            {
                client_id : githubConfig.clientId,
                client_secret : githubConfig.clientSecret,
                code,
            },
            {
                headers:{
                    Accept : "application/json",
                },
            }
        );
    
        const accessToken = tokenResponse.data.access_token;
    
        if(!accessToken){
            throw new ApiErrors(401 , "Github authentication Failed");
        }
    
        //second step : fetch github user 
    
        const userResponse = await axios.get(
            "https://api.github.com/user",
            {
                headers:{
                    Authorization:`Bearer ${accessToken}`,
                },
            }
        );
    
        //third step : fetch primary email
    
        const emailResponse = await axios.get(
            "https://api.github.com/user/emails",
            {
                headers:{
                    Authorization :`Bearer ${accessToken}`,
                },
            }
        );
    
        const primaryEmail = emailResponse.data.find(
            (email:any) =>  email.primary && email.verified
        );
    
        if (!primaryEmail){
            throw new ApiErrors(401, "GitHub email not verified");
        }
    
        return {
            email: primaryEmail.email,
            name: userResponse.data.name || userResponse.data.login,
            avatar: userResponse.data.avatar_url,
            provider: AuthProvider.GITHUB,
            providerId: String(userResponse.data.id),
          };
    }
    catch(error){
        throw new ApiErrors(401, "GitHub authentication failed");
    }
    
};