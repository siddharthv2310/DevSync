import prisma from "../../config/prisma.js";
import bcrypt from "bcrypt";
import { generateOtp,hashOtp,getOtpExpiry } from "../../utils/OTP.js";
import { sendLoginOtpEmail } from "../../utils/email.js";
import { ApiErrors } from "../../common/errors/ApiErrors.js";

export const createLoginOtp = async(userId:string) =>{
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiredAt = getOtpExpiry();

    await prisma.loginOtp.deleteMany({
        where:{
            userId,
        },
    })

    await prisma.loginOtp.create({
        data :{
            userId,
            otpHash,
            expiredAt,
        },
    })
    return otp;
};

export const loginUser = async(email:string , password:string) =>{
    const user = await prisma.user.findUnique({
        where:{
            email,
        },
    });

    if(!user || !user.password){
        throw new Error("invalid email or password");
    }

    const isValidPassword = bcrypt.compare(password,user.password);

    if(!isValidPassword){
        throw new Error("invalid email or password");
    }

    const otp = await createLoginOtp(user.id);

    // here we could not send email to other and we could only send email to my email.
    //  for sending email to others mail i need to have a domian that i could attach to resend to send the email

    await sendLoginOtpEmail(process.env.TO_EMAIL! , otp);

    return {user , otp};
};

export const verifyLoginOtp = async (email:string , otp:string ,)=>{

    const user = prisma.user.findUnique({
        where:{
            email,
        }
    });

    if(!user){
        throw new ApiErrors(401,"invalid otp");
    }

    const loginOtp = prisma.loginOtp.findFirst({
        where:{
            userId : user.id,
        }
    });
}

