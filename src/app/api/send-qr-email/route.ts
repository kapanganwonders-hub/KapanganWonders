export const runtime = "nodejs";

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import QRCode from "qrcode";

export async function POST(req: Request) {
  try {
    const { email, fullName, visitId, barangays, spotNames, date } = await req.json();

    // Generate QR code data
    const qrData = JSON.stringify({
      visitId,
      fullName,
      barangays,
      spotNames,
      date,
    });

    const qrImage = await QRCode.toDataURL(qrData);

    // Email setup
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Kapangan Wonders" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Approved Visit – Kapangan Wonders QR Code",
      html: `
        <h2>Kapangan Wonders</h2>
        <p>Hello <strong>${fullName}</strong>,</p>
        <p>Your visit has been <strong>approved</strong>!</p>

        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Barangays:</strong> ${barangays?.join(", ")}</p>
        <p><strong>Spots:</strong> ${spotNames?.join(", ")}</p>

        <p>Please present this QR code upon arrival:</p>
        <img src="${qrImage}" alt="QR Code" />
      `,
      attachments: [
        {
          filename: "qrcode.png",
          content: qrImage.split("base64,")[1],
          encoding: "base64",
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("EMAIL SEND ERROR:", error);
    return NextResponse.json({ success: false, error });
  }
}
