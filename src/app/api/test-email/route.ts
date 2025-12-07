import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function GET() {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Kapangan Wonders" <${process.env.EMAIL_USER}>`,
      to: "your_personal_email@gmail.com", // test destination
      subject: "Test Email from Kapangan Wonders",
      text: "If you received this, Nodemailer is working!",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("EMAIL ERROR:", error);
    return NextResponse.json({ success: false, error });
  }
}
