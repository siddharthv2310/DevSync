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
  });

  export const refreshTokenSchema = z.object({
    refreshToken: z
    .string()
    .min(1,"refresh token is required")
  });

  export const forgetPasswordSchema = z.object({
    email : z
    .string()
    .trim()
    .email("please provide valid email"),
  });


  export const verifyResetOtpSchema = z.object({
    email:z
    .string()
    .trim()
    .email("enter valid email"),

    otp:z
    .string()
    .regex(/^\d{6}$/,"OTP must be of6 digit"),
  });

  export const setNewPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long"),

    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

  export type SetNewPasswordInput = z.infer<typeof setNewPasswordSchema>;
  export type VerifyResetOtpInput = z.infer<typeof verifyResetOtpSchema>;
  export type forgetPasswordInput =z.infer<typeof forgetPasswordSchema>;
  export type refreshTokenInput = z.infer<typeof refreshTokenSchema>;
  export type VerifyLoginOtpInput = z.infer<typeof verifyLoginOtpSchema>;
  export type LoginInput = z.infer<typeof loginSchema>;