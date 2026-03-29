import { ServerClient } from "postmark";
import fs from "fs";
import path from "path";
import handlebars from "handlebars";
import dotenv from "dotenv";

dotenv.config();

const client = new ServerClient(process.env.POSTMARK_SERVER_TOKEN || "");
const FROM_EMAIL = process.env.POSTMARK_FROM_EMAIL || "team@teehive.com";

// Template caching
const templateCache: Record<string, HandlebarsTemplateDelegate> = {};

function getTemplate(templateName: string): HandlebarsTemplateDelegate {
    if (templateCache[templateName]) {
        return templateCache[templateName];
    }

    const templatePath = path.join(__dirname, `../templates/emails/${templateName}.html`);
    if (!fs.existsSync(templatePath)) {
        throw new Error(`Email template not found: ${templateName}`);
    }

    const source = fs.readFileSync(templatePath, "utf-8");
    const template = handlebars.compile(source);
    templateCache[templateName] = template;
    return template;
}

async function sendEmail(to: string, subject: string, templateName: string, data: any) {
    try {
        const template = getTemplate(templateName);
        const htmlBody = template(data);

        const response = await client.sendEmail({
            From: FROM_EMAIL,
            To: to,
            Subject: subject,
            HtmlBody: htmlBody,
            MessageStream: "outbound"
        });

        console.log(`📧 Email [${templateName}] sent to ${to}. MessageID: ${response.MessageID}`);
        return response;
    } catch (error) {
        console.error("❌ Postmark send error:", error);
        throw new Error("Failed to send system email.");
    }
}

interface OtpEmailOptions {
    to: string;
    otpCode: string;
}

export const sendOtpEmail = async (options: OtpEmailOptions) => {
    return sendEmail(
        options.to,
        "Your Hive Access Code 🐝",
        "customer-login-otp",
        { OTP: options.otpCode }
    );
};

export const sendOrderConfirmationEmail = async (to: string, name: string, orderData: { orderId: string, items: string, total: string }) => {
    return sendEmail(
        to,
        "Order Confirmed – You supported a creator 🐝",
        "customer-order-confirmation",
        { Name: name, OrderID: orderData.orderId, ProductSummary: orderData.items, Amount: orderData.total }
    );
};

export const sendAdminOrderNotification = async (orderData: { orderId: string, customerName: string, total: string }) => {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@teehive.com";
    return sendEmail(
        adminEmail,
        "New order received",
        "admin-order-notification",
        { OrderID: orderData.orderId, CustomerName: orderData.customerName, Amount: orderData.total, AdminPanelLink: `${process.env.FRONTEND_URL}/admin/orders` }
    );
};

export const sendArtistApprovalEmail = async (to: string, name: string) => {
    return sendEmail(
        to,
        "Welcome to the Hive, Creator 🐝",
        "artist-welcome",
        { ArtistName: name, ArtistDashboard: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/artist/dashboard` }
    );
};

export const sendArtistRejectionEmail = async (to: string, name: string, reason: string) => {
    return sendEmail(
        to,
        "Update required before entering the Hive",
        "artist-design-rejected",
        { ArtistName: name, Reason: reason }
    );
};

export const sendForgotPasswordEmail = async (to: string, name: string, resetLink: string, isArtist: boolean) => {
    const templateName = isArtist ? "artist-forgot-password" : "customer-forgot-password";
    const data = isArtist ? { ArtistName: name, ResetLink: resetLink } : { Name: name, ResetLink: resetLink };
    return sendEmail(
        to,
        "Reset your Hive access 🔐",
        templateName,
        data
    );
};

// Helper for other templates if needed
export const sendCustomEmail = async (to: string, subject: string, templateName: string, data: any) => {
    return sendEmail(to, subject, templateName, data);
};

