import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (email, otp) => {
  const { data, error } = await resend.emails.send({
    from: "Apna Ghar <onboarding@resend.dev>",
    to: email,
    subject: "Apna Ghar - Email Verification Code",
    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 500px;
        margin: auto;
        padding: 25px;
        border: 1px solid #ddd;
        border-radius: 10px;
      ">
        <h2 style="text-align:center;">APNA GHAR</h2>
        <p>Your email verification code is:</p>
        <h1 style="text-align:center; letter-spacing:8px;">
          ${otp}
        </h1>
        <p>This code will expire in <b>10 minutes</b>.</p>
        <p>If you did not request this code, you can ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    console.log("Resend error:", error);
    throw new Error(error.message || "Failed to send email");
  }

  console.log("Verification email sent, id:", data?.id);
};