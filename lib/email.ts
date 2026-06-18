import nodemailer from "nodemailer";

export function getEmailTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn("SMTP configuration is incomplete. Falling back to mock email logging.");
    return {
      sendMail: async (options: { to: string; subject: string; text: string; html?: string }) => {
        console.log(`[MOCK EMAIL SENT] To: ${options.to} | Subject: ${options.subject} | Content: ${options.text}`);
        return { messageId: "mock-id-" + Date.now() };
      }
    };
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  } as any);
}

export async function sendEmail({ to, subject, text, html }: { to: string; subject: string; text: string; html?: string }) {
  const transporter = getEmailTransporter();
  const from = process.env.SMTP_FROM || `"Kleenkars Support" <${process.env.SMTP_USER || "no-reply@kleenkars.com"}>`;
  
  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html: html || text,
    }) as any;
    console.log(`Email sent successfully: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}
