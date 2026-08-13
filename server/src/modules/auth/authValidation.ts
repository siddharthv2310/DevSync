import { z } from "zod";

export const loginSchema = z.object({
    email: z
      .string()
      .trim()
      .email("Please provide a valid email address"),
  
    password: z
      .string()
      .min(1, "Password is required"),
  });
  export const verifyLoginOtpSchema = z.object({
    email: z
    .string()
    .trim()
    .email("please provide valid email"),

    otp: z
    .string()
    .regex(/^\d{6}$/,"otp must be 6 digit number"),
  })
  
  export type VerifyLoginOtpInput = z.infer<typeof verifyLoginOtpSchema>;
  export type LoginInput = z.infer<typeof loginSchema>;