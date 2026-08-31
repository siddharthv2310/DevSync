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


export const sendOrganizationInvitationEmail = async(email: string,organizationName:string , token :string)=>{
  const inviteUrl = `${process.env.FRONTEND_URL}/invite/${token}`;

  console.log(token);

  await resend.emails.send({
    from:"onboarding@resend.dev",
    to: process.env.TO_EMAIL!,
    subject : `Invitation to join ${organizationName}`,
    html :`
          <h2>You're invited to join ${organizationName}</h2>

  ]       <p>Click the button below to accept the invitation.</p>

          <a href="${inviteUrl}"
              style="padding:12px 20px;background:#2563EB;color:white;text-decoration:none;border-radius:8px;">
              Accept Invitation
          </a>

          <p>This invitation expires in 7 days.</p>
    `
  });
};

