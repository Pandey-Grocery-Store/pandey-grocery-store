import nodemailer from 'nodemailer';
import prisma from '../lib/prisma.js';

// Generate 6-digit OTP
function generateOtpCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create SMTP transporter
function getTransporter() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
}

// Send OTP email
export async function sendOtp(email) {
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Mark all previous OTPs for this email as used
    await prisma.otp.updateMany({
        where: { email, used: false },
        data: { used: true },
    });

    // Create new OTP record
    await prisma.otp.create({
        data: { email, code, expiresAt },
    });

    // Send email
    try {
        const transporter = getTransporter();
        await transporter.sendMail({
            from: `"Pandey Grocery Store" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Your Pandey Grocery Store Login Code',
            html: `
        <div style="font-family:Arial,sans-serif;max-width:400px;margin:0 auto;padding:32px;background:#fff;border-radius:12px;border:1px solid #f3f4f6">
          <div style="text-align:center;margin-bottom:24px">
            <h2 style="color:#e8590c;margin:0">Pandey Grocery Store</h2>
            <p style="color:#6b7280;font-size:14px">Login Verification</p>
          </div>
          <div style="text-align:center;padding:24px;background:#fff7ed;border-radius:8px;margin-bottom:24px">
            <p style="color:#6b7280;font-size:14px;margin:0 0 8px">Your verification code is:</p>
            <div style="font-size:32px;font-weight:800;letter-spacing:8px;color:#e8590c">${code}</div>
          </div>
          <p style="color:#9ca3af;font-size:12px;text-align:center">This code expires in 10 minutes. Do not share it with anyone.</p>
        </div>
      `,
        });
    } catch (err) {
        console.error('Failed to send OTP email:', err.message);
        // In development, log the code so we can test without SMTP
        console.log(`📧 OTP for ${email}: ${code}`);
    }

    return { success: true };
}

// Verify OTP
export async function verifyOtp(email, code) {
    const otp = await prisma.otp.findFirst({
        where: {
            email,
            code,
            used: false,
            expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
    });

    if (!otp) return null;

    // Mark as used
    await prisma.otp.update({
        where: { id: otp.id },
        data: { used: true },
    });

    return otp;
}
