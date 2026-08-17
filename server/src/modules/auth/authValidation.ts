import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const verifyLoginOtpSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address"),
  otp: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit number"),
});

export const forgetPasswordSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address"),
});

export const verifyResetOtpSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address"),
  otp: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit number"),
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

export const googleAuthSchema = z.object({
  idToken: z.string().min(1, "Google ID token is required"),
});

export const githubCallbackSchema = z.object({
  code: z.string().min(1, "GitHub authorization code is required"),
  state: z.string().min(1, "OAuth state is required"),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),

    username: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can contain letters, numbers and underscore only"
      ),

    email: z.string().trim().email("Please provide a valid email address"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters"),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

  export const verifyRegisterOtpSchema = z.object({
    email:z.string().trim().email("please provide valid email address"),
    otp: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit number"),
  })


// Types
export type verifyRegisterOtpInput = z.infer<typeof verifyRegisterOtpSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type GithubCallbackInput = z.infer<typeof githubCallbackSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyLoginOtpInput = z.infer<typeof verifyLoginOtpSchema>;
export type ForgetPasswordInput = z.infer<typeof forgetPasswordSchema>;
export type VerifyResetOtpInput = z.infer<typeof verifyResetOtpSchema>;
export type SetNewPasswordInput = z.infer<typeof setNewPasswordSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;