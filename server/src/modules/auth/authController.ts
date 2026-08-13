import {Request ,Response } from "express"
import { loginSchema } from "./authValidation.js";
import { loginUser } from "./authService.js";

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

