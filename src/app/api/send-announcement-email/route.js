export const runtime = "nodejs";

import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const { subject, message, emails } = await req.json();

    if (!subject || !message) {
      return new Response(JSON.stringify({ error: "Subject and message are required" }), { status: 400 });
    }

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return new Response(JSON.stringify({ error: "No recipients found" }), { status: 400 });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return new Response(JSON.stringify({ error: "Email credentials not configured on the server" }), { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Kapangan Wonders" <${process.env.EMAIL_USER}>`,
      to: emails.join(","), // all users
      subject,
      html: `
        <h2>${subject}</h2>
        <p>${message}</p>
        <br/>
        <small>This message is from Kapangan Wonders.</small>
      `,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (err) {
    console.error("Email error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), { status: 500 });
  }
}
