import resend from "../config/resend.js";

export const sendLoginOtpEmail = async (to: string, otp: string,) => {

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


export const sendOrganizationInvitationEmail = async (email: string, organizationName: string, token: string) => {
  
  const frontendUrl = process.env.FRONTEND_URL;

  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: process.env.TO_EMAIL!,
    subject: `Invitation to join ${organizationName}`,
    html: `
          <h2>You're invited to join ${organizationName}</h2>

  ]       <p>Click the button below to accept the invitation.</p>


          <a href="${frontendUrl}/organization-invite/${token}?action=accept"> 
              Accept Invitation
          </a>

          <a href="${frontendUrl}/organization-invite/${token}?action=reject">
              Reject Invitation
          </a>

          <p>This invitation expires in 7 days.</p>
    `
  });
};

export const sendTeamInvitationEmail = async (email: string, teamName: string, organizationName: string, token: string) => {

  const frontendUrl = process.env.FRONTEND_URL;

  console.log(token);

  const { data, error } =
    await resend.emails.send({

      from: "onboarding@resend.dev",

      to: process.env.TO_EMAIL!,

      subject: `Invitation to join ${teamName}`,

      html: `
              <div>
                  <h2>You're invited to join ${teamName}</h2>

                  <p>
                      You have been invited to join
                      <strong>${teamName}</strong>
                      in <strong>${organizationName}</strong>.
                  </p>


                  <a href="${frontendUrl}/team-invite/${token}?action=accept"> 
                      Accept Invitation
                  </a>

                  <a href="${frontendUrl}/team-invite/${token}?action=reject">
                      Reject Invitation
                  </a>


                  <p>
                      This invitation expires in 7 days.
                  </p>

                  <p>
                      If you were not expecting this invitation,
                      you can safely ignore this email.
                  </p>
              </div>
          `
    });

  if (error) {
    throw new Error(
      `Failed to send team invitation email: ${error.message}`
    );
  }

  return data;
};