import resend from "../config/resend.js";

export const sendLoginOtpEmail = async (to: string , otp: string,) => {

  const { data, error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to,
    subject: "Your DevSync Login OTP",
    html: `
      <div>
        <h2>DevSync Login Verification</h2>

        <p>Your login verification code is:</p>

        <h1>${otp}</h1>

        <p>This OTP will expire in 5 minutes.</p>

        <p>If you did not attempt to log in, you can safely ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }

  return data;
};