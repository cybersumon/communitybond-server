
import nodemailer from "nodemailer";

export async function sendSubscriptionWelcomeEmail(
  email: string,
  unsubscribeToken: string
): Promise<boolean> {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASSWORD,
    SMTP_FROM,
    CLIENT_URL,
  } = process.env;

  if (
    !SMTP_HOST ||
    !SMTP_PORT ||
    !SMTP_USER ||
    !SMTP_PASSWORD ||
    !SMTP_FROM
  ) {
    console.warn(
      "[CommunityBond] SMTP not configured."
    );

    return false;
  }

  const origin =
    CLIENT_URL || "http://localhost:3000";

  const unsubscribeUrl = new URL(
    "/unsubscribe",
    origin
  );

  unsubscribeUrl.searchParams.set(
    "token",
    unsubscribeToken
  );

  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });

  await transport.sendMail({
    from: SMTP_FROM,
    to: email,
    subject: "Welcome to CommunityBond cause alerts",
    text: [
      "You have subscribed to CommunityBond local cause alerts.",
      "We'll share updates when notifications become available.",
      "",
      `To unsubscribe: ${unsubscribeUrl.toString()}`,
    ].join("\n"),
  });

  return true;
}
