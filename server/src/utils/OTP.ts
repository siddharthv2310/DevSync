import crypto from "crypto";

export const generateOtp = (): string =>{
    return crypto.randomInt(100000,1000000).toString();
}

export const hashOtp = (otp:string):string =>{
    return crypto.createHash("sha256").update(otp).digest("hex");
}

export const getOtpExpiry = () : Date =>{
    return new Date(Date.now() + 5*60*1000);
}