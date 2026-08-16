import prisma from "../../config/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { generateOtp, hashOtp, getOtpExpiry } from "../../utils/OTP.js";
import { sendLoginOtpEmail } from "../../utils/email.js";
import { ApiErrors } from "../../common/errors/ApiErrors.js";
import { generateAccessToken, generateRefreshTokens, generateResetPasswordToken } from "../../utils/jwt.js";
import { OAuthProfile } from "../../providers/authType.js";

export const createLoginOtp = async (userId: string) => {
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiredAt = getOtpExpiry();

    await prisma.loginOtp.deleteMany({
        where: {
            userId,
        },
    })

    await prisma.loginOtp.create({
        data: {
            userId,
            otpHash,
            expiredAt,
        },
    })
    return otp;
};

export const loginUser = async (email: string, password: string) => {
    const user = await prisma.user.findUnique({
        where: {
            email,
        },
    });

    if (!user || !user.password) {
        throw new Error("invalid email or password");
    }

    const isValidPassword = bcrypt.compare(password, user.password);

    if (!isValidPassword) {
        throw new Error("invalid email or password");
    }

    const otp = await createLoginOtp(user.id);

    // here we could not send email to other and we could only send email to my email.
    //  for sending email to others mail i need to have a domian that i could attach to resend to send the email

    await sendLoginOtpEmail(process.env.TO_EMAIL!, otp);

    return { user, otp };
};

export const verifyLoginOtp = async (email: string, otp: string,) => {

    const user = await prisma.user.findUnique({
        where: {
            email,
        }
    });

    if (!user) {
        throw new ApiErrors(401, "invalid otp");
    }

    const loginOtp = await prisma.loginOtp.findFirst({
        where: {
            userId: user.id,
        }
    });

    if (!loginOtp) {
        throw new ApiErrors(401, "Otp not found or already used");
    }

    if (loginOtp.expiredAt < new Date()) {
        await prisma.loginOtp.delete({
            where: {
                id: loginOtp.id,
            }
        });

        throw new ApiErrors(401, "OTP has expired");
    }
    if (loginOtp.attempts >= 5) {
        await prisma.loginOtp.delete({
            where: {
                id: loginOtp.id,
            }
        });
        throw new ApiErrors(429, "Too many attempts");
    }

    const OtpHash = hashOtp(otp);

    if (loginOtp.otpHash != OtpHash) {
        await prisma.loginOtp.update({
            where: {
                id: loginOtp.id,
            },
            data: {
                attempts: {
                    increment: 1,
                },
            },

        });

        throw new ApiErrors(400, "Invalid OTP");
    }

    await prisma.loginOtp.delete({
        where: {
            id: loginOtp.id,
        },
    });

    await prisma.user.update({
        where: {
            id: user.id,
        },
        data: {
            isEmailVerified: true,
        },
    });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshTokens(user.id);

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await prisma.user.update({
        where: {
            id: user.id,
        },
        data: {
            refreshToken: refreshTokenHash,
        },
    });


    return { user, accessToken, refreshToken };

}

export const getCurrentUser = async (userId: string) => {

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            username: true,
            email: true,
            avatar: true,
            provider: true,
            isEmailVerified: true,
            isActive: true,
            createdAt: true,
        },
    });

    if (!user) {
        throw new ApiErrors(404, "User not found");
    }

    return user;
};

interface refreshTokenPayload {
    userId: string;
}

export const refreshAccessToken = async (refreshToken: string) => {

    let decoded: refreshTokenPayload;

    try {
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as refreshTokenPayload;
    }
    catch (error) {
        throw new ApiErrors(401, "Invalid or expired refresh token");
    }

    const user = await prisma.user.findUnique({
        where: {
            id: decoded.userId,
        }
    })

    if (!user) {
        throw new ApiErrors(404, "User not found");
    }

    if (!user.refreshToken) {
        throw new ApiErrors(401, "Please login again");
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);

    if (!isMatch) {
        throw new ApiErrors(401, "Invalid refresh token");
    }

    const accessToken = generateAccessToken(user.id);

    return { accessToken };
}

export const logoutUser = async (userId: string) => {
    try {
        await prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                refreshToken: null,
            },
        });
    }
    catch (error) {
        throw new ApiErrors(400, "user not found");
    }
}

export const forgetPassword = async (email: string) => {

    const user = await prisma.user.findUnique({
        where: {
            email: email,
        },
    });

    if (!user) {
        throw new Error("User have no account! Sign in first");
    }

    await prisma.passwordResetOtp.deleteMany({
        where: {
            userId: user.id,
        }
    })

    const otp: string = generateOtp();
    const hashedOtp: string = hashOtp(otp);
    const expiresAt = getOtpExpiry();

    await prisma.passwordResetOtp.create({
        data: {
            userId: user.id,
            otpHash: hashedOtp,
            expiredAt: expiresAt,
        },
    });

    await sendLoginOtpEmail(process.env.TO_EMAIL!, otp);

};

export const verifyResetOtp = async (email: string, otp: string) => {
    const user = await prisma.user.findUnique({
        where: {
            email,
        },
    });

    if (!user) {
        throw new ApiErrors(400, "Invalid OTP or email");
    }

    const resetOtp = await prisma.passwordResetOtp.findFirst({
        where: {
            userId: user.id,
        },
    });

    if (!resetOtp) {
        throw new ApiErrors(400, "OTP not found or already used");
    }

    if (resetOtp.expiredAt < new Date()) {
        await prisma.passwordResetOtp.delete({
            where: {
                id: resetOtp.id,
            },
        });

        throw new ApiErrors(400, "OTP has expired");
    }

    if (resetOtp.attempts >= 5) {
        await prisma.passwordResetOtp.delete({
            where: {
                id: resetOtp.id,
            },
        });

        throw new ApiErrors(429, "to many OTP attempts");
    }

    const hashedOtp = hashOtp(otp);

    if (resetOtp.otpHash != hashedOtp) {
        await prisma.passwordResetOtp.update({
            where: { id: resetOtp.id },
            data: {
                attempts: resetOtp.attempts + 1,
            },
        });

        throw new ApiErrors(400, "Invalid OTP");
    }

    await prisma.passwordResetOtp.delete({
        where: {
            id: resetOtp.id,
        },
    });

    const resetToken = generateResetPasswordToken(user.id);

    return { resetToken };

}


export const resetPassword = async (userId: string, newPassword: string) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            password: hashedPassword,
            refreshToken: null,
        },
    });
}

export const loginWithOAuth = async (profile: OAuthProfile) => {
    let user = await prisma.user.findUnique({
        where: {
            email: profile.email,
        },
        include: {
            oauthAccounts: true,
        },
    });

    if (!user) {
        user = await prisma.user.create({
            data: {
                name: profile.name,
                email: profile.email,
                ...(profile.avatar ? { avatar: profile.avatar } : {}),
                isEmailVerified: true,
                isActive: true,

                oauthAccounts: {
                    create: {
                        provider: profile.provider,
                        providerId: profile.providerId,
                    },
                },
            },
            include: {
                oauthAccounts: true,
            },
        });
    }

    else {
        const alreadyLinked = user.oauthAccounts.some(
            (account) =>
                account.provider === profile.provider &&
                account.providerId === profile.providerId
        );

        if (!alreadyLinked) {
            await prisma.oAuthAccount.create({
                data: {
                    userId: user.id,
                    provider: profile.provider,
                    providerId: profile.providerId,
                },
            });
        }
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshTokens(user.id);

    const hashRefreshToken = await bcrypt.hash(refreshToken, 10);

    await prisma.user.update({
        where: {
            id: user.id,
        },
        data: {
            refreshToken: hashRefreshToken,
        },
        include: {
            oauthAccounts: true,
        },
    });

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            oauthAccounts: user.oauthAccounts,
        },
        accessToken,
        refreshToken,
    };
};






