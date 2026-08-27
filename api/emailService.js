import nodemailer from 'nodemailer';

// ── Module-level config (safe for templates — read env at import time) ──
const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://pandeygrocery-store.vercel.app';
const adminAlertEmail = process.env.ADMIN_ALERT_EMAIL || process.env.SMTP_USER || 'grocerypandey.store@gmail.com';

// ── Dynamic SMTP Transporter Helper ──
export function getTransporter() {
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER || 'grocerypandey.store@gmail.com';
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

    return {
        transporter: nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        }),
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPass,
        emailFrom: process.env.EMAIL_FROM || `"Pandey Grocery Store" <${smtpUser}>`,
        adminAlertEmail,
        appBaseUrl,
    };
}

/**
 * Verify SMTP Connection
 */
export async function verifySmtpConnection() {
    const { transporter, smtpHost, smtpPort, smtpUser, smtpPass, emailFrom } = getTransporter();

    if (!smtpPass) {
        return {
            configured: false,
            healthy: false,
            host: smtpHost,
            port: smtpPort,
            user: smtpUser,
            error: 'SMTP_PASS environment variable is not configured',
        };
    }

    let timeoutId;
    try {
        const verifyPromise = transporter.verify();
        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error('SMTP connection timed out')), 4000);
        });
        await Promise.race([verifyPromise, timeoutPromise]);
        clearTimeout(timeoutId);
        return {
            configured: true,
            healthy: true,
            host: smtpHost,
            port: smtpPort,
            user: smtpUser,
            from: emailFrom,
        };
    } catch (err) {
        if (timeoutId) clearTimeout(timeoutId);
        return {
            configured: true,
            healthy: false,
            host: smtpHost,
            port: smtpPort,
            user: smtpUser,
            error: err.message,
        };
    }
}

/**
 * Base generic email sender with error handling
 */
export async function sendEmail({ to, subject, html, text }) {
    const { transporter, smtpPass, emailFrom } = getTransporter();

    if (!smtpPass) {
        console.warn(`[EmailService] SMTP_PASS not set. Skipping email to ${to} (Subject: ${subject})`);
        return { success: false, reason: 'SMTP credentials not configured in environment' };
    }

    try {
        const info = await transporter.sendMail({
            from: emailFrom,
            to,
            subject,
            text: text || '',
            html,
        });
        console.log(`[EmailService] Email sent successfully to ${to}. MessageId: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (err) {
        console.error(`[EmailService] Failed to send email to ${to}:`, err.message);
        return { success: false, error: err.message };
    }
}

// ════════════════════ 1. OTP Verification Email ════════════════════
export async function sendOtpEmail(toEmail, otpCode) {
    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 20px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, #059669 0%, #064e3b 100%); padding: 28px 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;">🛒 Pandey Grocery Store</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 13px;">Haldwani, Uttarakhand • Quick 15–30 Min Delivery</p>
            </div>
            <div style="padding: 28px 24px; text-align: center;">
                <h2 style="color: #0f172a; margin: 0 0 8px; font-size: 18px; font-weight: 700;">Your Sign-In Code</h2>
                <p style="color: #64748b; margin: 0 0 20px; font-size: 14px; line-height: 1.5;">Enter the 6-digit verification code below to access your account. Valid for 10 minutes.</p>
                <div style="background: #f0fdf4; border: 2px dashed #10b981; border-radius: 12px; padding: 16px 24px; margin: 0 auto 20px; display: inline-block;">
                    <span style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #047857; font-family: 'Courier New', monospace;">${otpCode}</span>
                </div>
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">If you did not request this login code, you can safely disregard this message.</p>
            </div>
            <div style="background: #f8fafc; padding: 14px 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #94a3b8; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Pandey Grocery Store • Kusumkhera, Haldwani</p>
            </div>
        </div>
    </body>
    </html>`;

    return sendEmail({
        to: toEmail,
        subject: `${otpCode} is your Pandey Grocery verification code`,
        html,
        text: `Your sign-in code for Pandey Grocery Store is: ${otpCode}. It expires in 10 minutes.`,
    });
}

// ════════════════════ 2. Order Confirmation Email ════════════════════
export async function sendOrderConfirmationEmail(toEmail, order) {
    if (!toEmail) return { success: false, reason: 'No recipient email' };

    const items = order.items || [];
    const itemsHtml = items.map(item => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #0f172a; font-size: 14px; font-weight: 600;">
                ${item.name}
            </td>
            <td style="padding: 10px 0; text-align: center; color: #64748b; font-size: 14px;">
                ×${item.quantity || item.qty || 1}
            </td>
            <td style="padding: 10px 0; text-align: right; color: #0f172a; font-size: 14px; font-weight: 700;">
                ₹${((item.price || 0) * (item.quantity || item.qty || 1)).toFixed(2)}
            </td>
        </tr>
    `).join('');

    const trackUrl = `${appBaseUrl}/track/${order.orderNumber || order.id}`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 20px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
            <div style="background: linear-gradient(135deg, #059669 0%, #064e3b 100%); padding: 28px 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;">🛒 Order Confirmed!</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 14px;">Thank you for shopping with Pandey Grocery Store</p>
            </div>

            <div style="padding: 24px;">
                <div style="display: flex; justify-content: space-between; border-bottom: 1.5px solid #f1f5f9; padding-bottom: 14px; margin-bottom: 16px;">
                    <div>
                        <span style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">Order Number</span>
                        <div style="font-size: 15px; font-weight: 900; color: #0f172a;">#${order.orderNumber || order.id}</div>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">Delivery</span>
                        <div style="font-size: 14px; font-weight: 800; color: #059669;">
                            ${order.deliveryType === 'pickup' ? '🏪 Store Pickup' : '⚡ 15–30 Min Express'}
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: 20px;">
                    <h3 style="font-size: 13px; font-weight: 800; color: #0f172a; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 0.03em;">Items Ordered</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 1.5px solid #e2e8f0; color: #94a3b8; font-size: 11px; text-transform: uppercase;">
                                <th style="text-align: left; padding-bottom: 6px;">Product</th>
                                <th style="text-align: center; padding-bottom: 6px;">Qty</th>
                                <th style="text-align: right; padding-bottom: 6px;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>
                </div>

                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; font-size: 13px; color: #64748b; margin-bottom: 6px;">
                        <span>Subtotal:</span>
                        <span>₹${(order.subtotal || order.total).toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 900; color: #0f172a; border-top: 1px dashed #cbd5e1; padding-top: 8px; margin-top: 6px;">
                        <span>Grand Total:</span>
                        <span style="color: #059669;">₹${(order.total || 0).toFixed(2)}</span>
                    </div>
                </div>

                ${order.address ? `
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px 14px; margin-bottom: 20px;">
                    <strong style="font-size: 12px; color: #166534; text-transform: uppercase; display: block; margin-bottom: 2px;">📍 Delivery Location</strong>
                    <p style="font-size: 13px; color: #14532d; margin: 0; line-height: 1.4;">${order.customer} • ${order.address}</p>
                </div>` : ''}

                <div style="text-align: center; margin-top: 24px;">
                    <a href="${trackUrl}" style="background: #059669; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 800; display: inline-block;">
                        🚚 Live Track Your Order
                    </a>
                </div>
            </div>

            <div style="background: #f8fafc; padding: 16px 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; font-size: 12px; margin: 0 0 4px;">Store Support: <strong>+91 94120 86450</strong> • Haldwani, Uttarakhand</p>
                <p style="color: #94a3b8; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Pandey Grocery Store</p>
            </div>
        </div>
    </body>
    </html>`;

    return sendEmail({
        to: toEmail,
        subject: `Order Confirmed #${order.orderNumber || order.id} — Pandey Grocery Store`,
        html,
        text: `Your order #${order.orderNumber || order.id} of ₹${order.total} has been confirmed. Track live at: ${trackUrl}`,
    });
}

// ════════════════════ 3. Order Status Update Email ════════════════════
export async function sendOrderStatusUpdateEmail(toEmail, order, newStatus) {
    if (!toEmail) return { success: false, reason: 'No recipient email' };

    const statusTitles = {
        packing: '📦 Your Order is Being Packed',
        packed: '✅ Order Packed & Ready for Dispatch',
        dispatched: '🚚 Order Dispatched & Out for Delivery',
        delivered: '🎉 Order Delivered Successfully!',
    };

    const statusDescriptions = {
        packing: 'Our store team is carefully selecting and packing fresh items for your order.',
        packed: 'All items have been verified and sealed in secure packaging.',
        dispatched: 'Our delivery rider is on the way to your doorstep in Haldwani with your order.',
        delivered: 'Your order has been delivered! Thank you for ordering from Pandey Grocery Store.',
    };

    const title = statusTitles[newStatus] || `Order Status Updated to ${newStatus}`;
    const desc = statusDescriptions[newStatus] || `Your order #${order.orderNumber || order.id} status is now ${newStatus}.`;
    const trackUrl = `${appBaseUrl}/track/${order.orderNumber || order.id}`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 20px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, #059669 0%, #064e3b 100%); padding: 28px 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;">${title}</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 13px;">Order #${order.orderNumber || order.id}</p>
            </div>
            <div style="padding: 24px; text-align: center;">
                <p style="color: #334155; margin: 0 0 20px; font-size: 15px; line-height: 1.5;">${desc}</p>
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; margin-bottom: 20px; text-align: left;">
                    <div style="font-size: 13px; color: #64748b; margin-bottom: 4px;"><strong>Customer:</strong> ${order.customer || 'Store Customer'}</div>
                    <div style="font-size: 13px; color: #64748b; margin-bottom: 4px;"><strong>Total Amount:</strong> ₹${order.total}</div>
                    <div style="font-size: 13px; color: #64748b;"><strong>Status:</strong> <span style="color: #059669; font-weight: 800; text-transform: uppercase;">${newStatus}</span></div>
                </div>
                <a href="${trackUrl}" style="background: #059669; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 800; display: inline-block;">
                    View Live Tracking & Details
                </a>
            </div>
            <div style="background: #f8fafc; padding: 14px 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #94a3b8; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Pandey Grocery Store • Haldwani</p>
            </div>
        </div>
    </body>
    </html>`;

    return sendEmail({
        to: toEmail,
        subject: `Update on Order #${order.orderNumber || order.id}: ${title}`,
        html,
        text: `Update on your order #${order.orderNumber || order.id}: ${title}. Track live at ${trackUrl}`,
    });
}

// ════════════════════ 4. Print Job Submission Email ════════════════════
export async function sendPrintJobEmail(toEmail, job) {
    if (!toEmail) return { success: false, reason: 'No recipient email' };

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 20px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%); padding: 28px 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;">🖨️ Print Hub Job Received</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 13px;">Job #${job.jobNumber}</p>
            </div>
            <div style="padding: 24px;">
                <p style="color: #334155; font-size: 14px; line-height: 1.5; margin: 0 0 16px;">
                    We have received your print service request. Our team in Haldwani will process high-quality 300 DPI prints for you.
                </p>
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 20px;">
                    <div style="font-size: 13px; color: #64748b; margin-bottom: 6px;"><strong>Service Type:</strong> ${job.type}</div>
                    <div style="font-size: 13px; color: #64748b; margin-bottom: 6px;"><strong>Quantity / Copies:</strong> ${job.quantity}</div>
                    <div style="font-size: 13px; color: #64748b;"><strong>Status:</strong> <span style="color: #7c3aed; font-weight: 700; text-transform: uppercase;">${job.status}</span></div>
                </div>
                <p style="color: #64748b; font-size: 12px; margin: 0;">You can collect your prints at Pandey Store Counter or request delivery with your grocery order.</p>
            </div>
            <div style="background: #f8fafc; padding: 14px 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #94a3b8; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Pandey Grocery Store Print Hub • Haldwani</p>
            </div>
        </div>
    </body>
    </html>`;

    return sendEmail({
        to: toEmail,
        subject: `Print Service Request #${job.jobNumber} Received — Pandey Store`,
        html,
        text: `Your print job #${job.jobNumber} (${job.type}) has been received at Pandey Store Print Hub.`,
    });
}

// ════════════════════ 5. Store Admin Alert for New Orders ════════════════════
export async function sendAdminNewOrderAlert(order) {
    if (!adminAlertEmail) return;

    const html = `
    <div style="font-family: sans-serif; padding: 20px; background: #f8fafc;">
        <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0;">
            <h2 style="color: #059669; margin: 0 0 10px;">🔔 New Order Received: #${order.orderNumber || order.id}</h2>
            <p style="color: #334155; font-size: 14px;"><strong>Customer:</strong> ${order.customer} (Ph: ${order.phone || 'N/A'})</p>
            <p style="color: #334155; font-size: 14px;"><strong>Total:</strong> ₹${order.total} • <strong>Mode:</strong> ${order.deliveryType} (${order.paymentMode})</p>
            <p style="color: #334155; font-size: 14px;"><strong>Address:</strong> ${order.address || 'In-store pickup'}</p>
            <a href="${appBaseUrl}/staff/orders" style="background: #059669; color: #fff; padding: 8px 16px; border-radius: 6px; text-decoration: none; display: inline-block; font-size: 13px; font-weight: 700; margin-top: 10px;">
                Open Staff Orders Queue
            </a>
        </div>
    </div>`;

    return sendEmail({
        to: adminAlertEmail,
        subject: `🔔 New Order #${order.orderNumber || order.id} (₹${order.total}) — ${order.customer}`,
        html,
        text: `New order #${order.orderNumber || order.id} received from ${order.customer} for ₹${order.total}.`,
    });
}

// ════════════════════ 6. Welcome Registration Email ════════════════════
export async function sendWelcomeEmail(toEmail, userName) {
    if (!toEmail) return { success: false, reason: 'No recipient email' };

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 20px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, #059669 0%, #064e3b 100%); padding: 32px 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">Welcome to Pandey Grocery! 🛒</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 14px;">Your neighborhood store in Haldwani, Uttarakhand</p>
            </div>
            <div style="padding: 28px 24px; text-align: center;">
                <h2 style="color: #0f172a; margin: 0 0 10px; font-size: 18px; font-weight: 700;">Hello ${userName || 'Neighbor'},</h2>
                <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
                    We are thrilled to have you as part of our community! Enjoy fresh groceries, daily staples, school stationery, and fast xerox/print services with 15–30 min express delivery across Haldwani.
                </p>
                <a href="${appBaseUrl}" style="background: #059669; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 800; display: inline-block;">
                    Start Shopping Groceries
                </a>
            </div>
            <div style="background: #f8fafc; padding: 14px 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #94a3b8; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Pandey Grocery Store • Kusumkhera, Haldwani</p>
            </div>
        </div>
    </body>
    </html>`;

    return sendEmail({
        to: toEmail,
        subject: `Welcome to Pandey Grocery Store, ${userName || 'Friend'}! 🛒`,
        html,
        text: `Welcome to Pandey Grocery Store! Start shopping at ${appBaseUrl}`,
    });
}

// ════════════════════ 7. Custom Broadcast / Notification Email ════════════════════
export async function sendBroadcastNotificationEmail({ to, subject, headline, message, buttonText, buttonUrl }) {
    if (!to) return { success: false, reason: 'No recipient email' };

    const actionBtn = buttonUrl ? `
        <div style="text-align: center; margin: 24px 0 8px;">
            <a href="${buttonUrl}" style="background: #059669; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 800; display: inline-block;">
                ${buttonText || 'Open Store'}
            </a>
        </div>
    ` : '';

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 20px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, #059669 0%, #064e3b 100%); padding: 28px 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800;">🛒 Pandey Grocery Store</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 13px;">Customer Announcement</p>
            </div>
            <div style="padding: 28px 24px;">
                <h2 style="color: #0f172a; margin: 0 0 12px; font-size: 18px; font-weight: 700;">${headline || subject}</h2>
                <div style="color: #334155; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</div>
                ${actionBtn}
            </div>
            <div style="background: #f8fafc; padding: 14px 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #94a3b8; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Pandey Grocery Store • Haldwani, Uttarakhand</p>
            </div>
        </div>
    </body>
    </html>`;

    return sendEmail({
        to,
        subject,
        html,
        text: message,
    });
}

// ════════════════════ 8. Password Changed Security Alert ════════════════════
export async function sendPasswordChangedAlert(toEmail, userName) {
    if (!toEmail) return { success: false, reason: 'No recipient email' };

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 20px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800;">🔒 Security Notification</h1>
                <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px;">Pandey Grocery Store Account Security</p>
            </div>
            <div style="padding: 24px;">
                <h2 style="color: #0f172a; margin: 0 0 10px; font-size: 17px; font-weight: 700;">Password Updated Successfully</h2>
                <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0 0 16px;">
                    Hello ${userName || 'Customer'}, the password for your account (<strong>${toEmail}</strong>) was recently modified.
                </p>
                <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 12px 14px; margin-bottom: 16px;">
                    <p style="color: #991b1b; font-size: 12px; margin: 0; line-height: 1.4;">
                        <strong>Did not make this change?</strong> Please contact store support immediately at <strong>+91 94120 86450</strong> to protect your account.
                    </p>
                </div>
            </div>
            <div style="background: #f8fafc; padding: 12px 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #94a3b8; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Pandey Grocery Store • Haldwani</p>
            </div>
        </div>
    </body>
    </html>`;

    return sendEmail({
        to: toEmail,
        subject: `Security Alert: Your Pandey Grocery Store password was changed`,
        html,
        text: `Your password for Pandey Grocery Store was recently updated. If this wasn't you, please contact support.`,
    });
}

// ════════════════════ 9. Print Job Ready for Pickup Email ════════════════════
export async function sendPrintJobStatusUpdateEmail(toEmail, job, newStatus) {
    if (!toEmail) return { success: false, reason: 'No recipient email' };

    const statusTitle = newStatus === 'completed' || newStatus === 'ready' 
        ? '✅ Your Prints are Ready for Pickup!' 
        : `Print Job #${job.jobNumber} Status: ${newStatus}`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 20px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%); padding: 28px 24px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;">${statusTitle}</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 13px;">Job #${job.jobNumber}</p>
            </div>
            <div style="padding: 24px;">
                <p style="color: #334155; font-size: 14px; line-height: 1.5; margin: 0 0 16px;">
                    Great news! Your print job (${job.type}) is ready. High quality 300 DPI print output is completed and packaged.
                </p>
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 20px;">
                    <div style="font-size: 13px; color: #64748b; margin-bottom: 4px;"><strong>Job Number:</strong> #${job.jobNumber}</div>
                    <div style="font-size: 13px; color: #64748b; margin-bottom: 4px;"><strong>Type:</strong> ${job.type}</div>
                    <div style="font-size: 13px; color: #64748b;"><strong>Status:</strong> <span style="color: #7c3aed; font-weight: 800; text-transform: uppercase;">${newStatus}</span></div>
                </div>
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px 14px;">
                    <p style="color: #166534; font-size: 13px; margin: 0; font-weight: 600;">
                        📍 Pickup at Pandey Store Counter, Kusumkhera, Haldwani
                    </p>
                </div>
            </div>
            <div style="background: #f8fafc; padding: 14px 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #94a3b8; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Pandey Grocery Store Print Hub • Haldwani</p>
            </div>
        </div>
    </body>
    </html>`;

    return sendEmail({
        to: toEmail,
        subject: `Your Prints are Ready #${job.jobNumber} — Pandey Store Print Hub`,
        html,
        text: `Your print job #${job.jobNumber} is now ready for pickup at Pandey Store.`,
    });
}

// ════════════════════ 10. Delivery Rider Assignment Email ════════════════════
export async function sendDeliveryAssignmentCustomerEmail(toEmail, order, riderName) {
    if (!toEmail) return { success: false, reason: 'No recipient email' };

    const trackUrl = `${appBaseUrl}/track/${order.orderNumber || order.id}`;

    const html = `
    <div style="font-family: sans-serif; padding: 20px; background: #f8fafc;">
        <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 14px; padding: 24px; border: 1px solid #e2e8f0;">
            <h2 style="color: #059669; margin: 0 0 8px;">🛵 Delivery Partner Assigned!</h2>
            <p style="color: #334155; font-size: 14px; line-height: 1.5;">
                <strong>${riderName || 'Our Rider'}</strong> has been assigned to deliver Order <strong>#${order.orderNumber || order.id}</strong> to your doorstep in Haldwani.
            </p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin: 16px 0;">
                <div style="font-size: 13px; color: #64748b; margin-bottom: 4px;"><strong>Delivery Location:</strong> ${order.address}</div>
                <div style="font-size: 13px; color: #64748b;"><strong>Order Total:</strong> ₹${order.total}</div>
            </div>
            <a href="${trackUrl}" style="background: #059669; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: 700; font-size: 13px;">
                Live Track Delivery
            </a>
        </div>
    </div>`;

    return sendEmail({
        to: toEmail,
        subject: `🛵 Delivery Partner Assigned: Order #${order.orderNumber || order.id} is On The Way`,
        html,
        text: `Your delivery partner ${riderName} has been assigned for Order #${order.orderNumber || order.id}. Track at ${trackUrl}`,
    });
}

export async function sendDeliveryAssignmentRiderEmail(riderEmail, order) {
    if (!riderEmail) return { success: false, reason: 'No rider email' };

    const items = order.items || [];
    const itemsSummary = items.map(i => `${i.name} (x${i.quantity || i.qty || 1})`).join(', ');

    const html = `
    <div style="font-family: sans-serif; padding: 20px; background: #f8fafc;">
        <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 14px; padding: 24px; border: 1px solid #e2e8f0;">
            <h2 style="color: #059669; margin: 0 0 8px;">📦 New Delivery Assignment!</h2>
            <p style="color: #334155; font-size: 14px; line-height: 1.5;">
                You have been assigned to deliver Order <strong>#${order.orderNumber || order.id}</strong>.
            </p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin: 16px 0;">
                <div style="font-size: 13px; color: #64748b; margin-bottom: 4px;"><strong>Customer:</strong> ${order.customer || 'Customer'}</div>
                <div style="font-size: 13px; color: #64748b; margin-bottom: 4px;"><strong>Phone:</strong> ${order.phone || 'N/A'}</div>
                <div style="font-size: 13px; color: #64748b; margin-bottom: 4px;"><strong>Drop Address:</strong> ${order.address || 'Haldwani'}</div>
                <div style="font-size: 13px; color: #64748b; margin-bottom: 4px;"><strong>Collect Total:</strong> ₹${order.total} (${order.paymentMode || 'COD'})</div>
                <div style="font-size: 13px; color: #64748b;"><strong>Items:</strong> ${itemsSummary}</div>
            </div>
            <a href="${appBaseUrl}/delivery/dashboard" style="background: #059669; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: 700; font-size: 13px;">
                Open Delivery Dashboard
            </a>
        </div>
    </div>`;

    return sendEmail({
        to: riderEmail,
        subject: `📦 New Delivery Task: Order #${order.orderNumber || order.id} (₹${order.total})`,
        html,
        text: `New delivery assignment for Order #${order.orderNumber || order.id}. Deliver to ${order.address}. Total: ₹${order.total}`,
    });
}

// ════════════════════ 11. Low Stock Inventory Alert Email ════════════════════
export async function sendLowStockAlertEmail(product) {
    if (!adminAlertEmail) return;

    const html = `
    <div style="font-family: sans-serif; padding: 20px; background: #f8fafc;">
        <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 20px; border: 1px solid #fecaca;">
            <h3 style="color: #dc2626; margin: 0 0 10px;">⚠️ Low Stock Alert: ${product.name}</h3>
            <p style="color: #334155; font-size: 14px;"><strong>Current Remaining Stock:</strong> <span style="color: #dc2626; font-weight: 800;">${product.stock} ${product.unit || 'units'}</span></p>
            <p style="color: #64748b; font-size: 13px;"><strong>Category:</strong> ${product.category} • <strong>Price:</strong> ₹${product.price}</p>
            <a href="${appBaseUrl}/staff/inventory" style="background: #dc2626; color: #fff; padding: 8px 16px; border-radius: 6px; text-decoration: none; display: inline-block; font-size: 12px; font-weight: 700; margin-top: 10px;">
                Open Reorder & Inventory Management
            </a>
        </div>
    </div>`;

    return sendEmail({
        to: adminAlertEmail,
        subject: `⚠️ Low Stock Alert (${product.stock} left): ${product.name}`,
        html,
        text: `Low stock alert for ${product.name}. Only ${product.stock} units remaining.`,
    });
}
