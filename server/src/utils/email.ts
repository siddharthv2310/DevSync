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
    html:  `
    <div style=" margin: 0; padding: 40px 20px; background-color: #f4f7fb; font-family: Arial, Helvetica, sans-serif; ">
      <div style=" max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 8px 30px rgba(0,0,0,0.08); ">

        <!-- Header -->
        <div style="padding: 32px;background: linear-gradient(135deg, #4f46e5, #7c3aed);text-align: center;  ">
          <div style="  display: inline-block;  width: 52px;  height: 52px;  line-height: 52px;  border-radius: 14px;  background: rgba(255,255,255,0.18);  color: #ffffff;  font-size: 24px;  font-weight: bold;">
            DevSync
          </div>

          <h1 style=" margin: 18px 0 0;  color: #ffffff;  font-size: 25px;  font-weight: 700;">
             You're Invited!
          </h1>
        </div>

        <!-- Content -->
        <div style="padding: 38px 36px;">

          <p style=" margin: 0 0 12px; color: #111827; font-size: 17px;">
            Hello,
          </p>

          <p style=" margin: 0 0 24px; color: #4b5563; font-size: 15px; line-height: 1.7;">

            You've been invited to join

            <strong style="color: #111827;">

              ${organizationName}

            </strong>
            on <strong>DevSync</strong>.
          </p>

          <div style="padding: 20px; margin-bottom: 30px;background: #f8f7ff;border: 1px solid #e5e7eb;border-radius: 12px;text-align: center;">
            <p style="margin: 0 0 6px;color: #6b7280;font-size: 13px;">

              Organization

            </p>

            <p style="margin: 0;color: #312e81;font-size: 19px;font-weight: 700;">
              ${organizationName}
            </p>
          </div>

          <p style="margin: 0 0 18px;color: #374151;font-size: 15px;text-align: center;">
            Choose an option below:
          </p>

          <!-- Buttons -->
          <div style="text-align: center;">

            <a  href="${frontendUrl}/organization-invite/${token}?action=accept"
              style="display: inline-block;padding: 13px 28px;margin: 0 6px 12px;background: #4f46e5;color: #ffffff;text-decoration: none;border-radius: 9px;font-size: 14px;font-weight: 700;">

              ✓ Accept Invitation

            </a>

            <a
              href="${frontendUrl}/organization-invite/${token}?action=reject"
              style="display: inline-block;padding: 13px 28px;margin: 0 6px 12px;background: #ffffff;color: #dc2626;text-decoration: none;border: 1px solid #fecaca;border-radius: 9px;font-size: 14px;font-weight: 700;">
              ✕ Decline
            </a>

          </div>

          <div style="height: 1px;background: #e5e7eb;margin: 28px 0;"></div>

          <p style="
            margin: 0;
            color: #6b7280;
            font-size: 13px;
            line-height: 1.6;
            text-align: center;
          ">
            This invitation will expire in
            <strong style="color: #374151;">7 days</strong>.
          </p>

          <p style="
            margin: 12px 0 0;
            color: #9ca3af;
            font-size: 12px;
            line-height: 1.5;
            text-align: center;
          ">
            If you weren't expecting this invitation, you can safely
            ignore this email.
          </p>

        </div>

        <!-- Footer -->
        <div style="
          padding: 20px;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
          text-align: center;
        ">
          <p style="
            margin: 0;
            color: #9ca3af;
            font-size: 12px;
          ">
            © ${new Date().getFullYear()} DevSync · Team Collaboration Platform
          </p>
        </div>

      </div>
    </div>
  `,
});
};

export const sendTeamInvitationEmail = async (email: string, teamName: string, organizationName: string, token: string) => {

  const frontendUrl = process.env.FRONTEND_URL;


  const { data, error } =
    await resend.emails.send({

      from: "onboarding@resend.dev",

      to: process.env.TO_EMAIL!,

      subject: `Invitation to join ${teamName}`,

      html: `
      <div style="
        margin: 0;
        padding: 40px 20px;
        background-color: #f4f7fb;
        font-family: Arial, Helvetica, sans-serif;
      ">
        <div style="
          max-width: 560px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          box-shadow: 0 8px 30px rgba(0,0,0,0.08);
        ">

          <!-- Header -->
          <div style="
            padding: 32px;
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            text-align: center;
          ">
            <div style="
              display: inline-block;
              width: 52px;
              height: 52px;
              line-height: 52px;
              border-radius: 14px;
              background: rgba(255,255,255,0.18);
              color: #ffffff;
              font-size: 24px;
              font-weight: bold;
            ">
              DevSync
            </div>

            <h1 style="
              margin: 18px 0 0;
              color: #ffffff;
              font-size: 25px;
              font-weight: 700;
            ">
              Team Invitation
            </h1>
          </div>

          <!-- Content -->
          <div style="padding: 38px 36px;">

            <p style="
              margin: 0 0 12px;
              color: #111827;
              font-size: 17px;
            ">
              Hello,
            </p>

            <p style="
              margin: 0 0 24px;
              color: #4b5563;
              font-size: 15px;
              line-height: 1.7;
            ">
              You've been invited to join
              <strong style="color: #111827;">
                ${teamName}
              </strong>
              in the
              <strong style="color: #111827;">
                ${organizationName}
              </strong>
              organization.
            </p>

            <!-- Team Card -->
            <div style="
              padding: 22px;
              margin-bottom: 30px;
              background: #f8f7ff;
              border: 1px solid #e5e7eb;
              border-radius: 12px;
            ">

              <p style="
                margin: 0 0 5px;
                color: #6b7280;
                font-size: 12px;
              ">
                TEAM
              </p>

              <p style="
                margin: 0 0 16px;
                color: #312e81;
                font-size: 20px;
                font-weight: 700;
              ">
                ${teamName}
              </p>

              <p style="
                margin: 0 0 5px;
                color: #6b7280;
                font-size: 12px;
              ">
                ORGANIZATION
              </p>

              <p style="
                margin: 0;
                color: #111827;
                font-size: 15px;
                font-weight: 600;
              ">
                ${organizationName}
              </p>

            </div>

            <p style="
              margin: 0 0 18px;
              color: #374151;
              font-size: 15px;
              text-align: center;
            ">
              Would you like to join this team?
            </p>

            <!-- Buttons -->
            <div style="text-align: center;">

              <a
                href="${frontendUrl}/team-invite/${token}?action=accept"
                style="
                  display: inline-block;
                  padding: 13px 28px;
                  margin: 0 6px 12px;
                  background: #4f46e5;
                  color: #ffffff;
                  text-decoration: none;
                  border-radius: 9px;
                  font-size: 14px;
                  font-weight: 700;
                "
              >
                ✓ Accept Invitation
              </a>

              <a
                href="${frontendUrl}/team-invite/${token}?action=reject"
                style="
                  display: inline-block;
                  padding: 13px 28px;
                  margin: 0 6px 12px;
                  background: #ffffff;
                  color: #dc2626;
                  text-decoration: none;
                  border: 1px solid #fecaca;
                  border-radius: 9px;
                  font-size: 14px;
                  font-weight: 700;
                "
              >
                ✕ Decline
              </a>

            </div>

            <div style="
              height: 1px;
              background: #e5e7eb;
              margin: 28px 0;
            "></div>

            <p style="
              margin: 0;
              color: #6b7280;
              font-size: 13px;
              line-height: 1.6;
              text-align: center;
            ">
              This invitation will expire in
              <strong style="color: #374151;">7 days</strong>.
            </p>

            <p style="
              margin: 12px 0 0;
              color: #9ca3af;
              font-size: 12px;
              line-height: 1.5;
              text-align: center;
            ">
              If you weren't expecting this invitation, you can safely
              ignore this email.
            </p>

          </div>

          <!-- Footer -->
          <div style="
            padding: 20px;
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
            text-align: center;
          ">
            <p style="
              margin: 0;
              color: #9ca3af;
              font-size: 12px;
            ">
              © ${new Date().getFullYear()} DevSync · Team Collaboration Platform
            </p>
          </div>

        </div>
      </div>
    `,
  });

  if (error) {
    throw new Error(
      `Failed to send team invitation email: ${error.message}`
    );
  }

  return data;
};