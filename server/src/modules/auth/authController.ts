import {Request ,Response } from "express"
import { loginSchema, verifyLoginOtpSchema } from "./authValidation.js";
import { loginUser } from "./authService.js";
import { ApiErrors } from "../../common/errors/ApiErrors.js";
import { verifyLoginOtp } from "./authService.js";

// export const healthCheck = (req:Request , res:Response)=>{
//     res.status(200).json({success:true , message : "auth modeule working fine"});
// }

export const login = async (req:Request ,res:Response )=>{

    const result =  loginSchema.safeParse(req.body);
    // above one have two outcome {error , data};

    if(!result.success){
        return res.status(400).json({
            success : false,
            message : "invalid request",
            errors : result.error.flatten(),
        });
    }

    const { email , password } = result.data;

    try{
        const {otp} = await loginUser(email,password);

        return res.status(200).json({
            success : true,
            message : "OTP send successfully",
            data:{
                requirestOtp : true,
            }
        });
    }
    catch(error){
        return res.status(401).json({
            success : false,
            message : error instanceof Error ? error.message : "Invalid email or password",
        });
    }
}

export const completeVerifyLoginOtp = async (req : Request, res : Response) => {
    const {data,error} = verifyLoginOtpSchema.safeParse(req.body);
    if(error){
        return res.status(400).json({
            status:false,
            message:"Invalid request",
            errors: error.flatten(),
        });
    }

    const {email,otp} = data;

    try{

        const {user,accessToken,refreshToken } = await verifyLoginOtp(email,otp);

        return res.status(200).json({
            status:true,
            message: "OTP verifyied successfully",
            data:{
                user:{
                    userId : user.id,
                    userName : user.name,
                    userEmail : user.email,
                },
                accessToken,
                refreshToken,
            }
        })

    }
    catch(error){
        const statusCode = error instanceof ApiErrors ? error.statusCode : 500;

        return res.status(statusCode).json({
            status: false,
            message:error instanceof Error ? error.message : "Something went wrong",
        });
    }
}

export const getCurrentUser = async(req:Request , res:Response) =>{
    return res.status(200).json({
        success:true,
        message:"Authenticated",
        data:{
            user : req.user?.userId,
        },
    });
}
