import { ServerClient } from "postmark";
import fs from "fs";
import path from "path";
import handlebars from "handlebars";
import dotenv from "dotenv";

dotenv.config();

const client = new ServerClient(process.env.POSTMARK_SERVER_TOKEN || "");
const FROM_EMAIL = process.env.POSTMARK_FROM_EMAIL || "team@teehive.com";

export function frontendBaseUrl(): string {
    return (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
}

/** Public product page (matches customer router). */
export function productPublicUrl(productId: string): string {
    return `${frontendBaseUrl()}/products/${encodeURIComponent(productId)}`;
}

/** Public artist storefront (slug preferred). */
export function artistStorefrontUrl(artist: { id: string; artistSlug?: string | null }): string {
    const slug = artist.artistSlug?.trim();
    if (slug) return `${frontendBaseUrl()}/artists/${encodeURIComponent(slug)}`;
    return `${frontendBaseUrl()}/artists/${artist.id}`;
}

export type OrderEmailLineItem = {
    Name: string;
    ProductUrl: string;
    Quantity: number;
    Size: string;
    Color: string;
    LineTotal: string;
    ArtistName: string;
    ArtistUrl: string;
};

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
        const htmlBody = template({
            ...data,
            BannerURL:
                process.env.EMAIL_BANNER_URL ||
                "https://pub-7f5de94304e647a1b6b59ba54680291a.r2.dev/site-assets/email-banner-1774510626168.png",
        });

        const response = await client.sendEmail({
            From: FROM_EMAIL,
            To: to,
            Subject: subject,
            HtmlBody: htmlBody,
            MessageStream: "outbound",
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
    isArtist?: boolean;
}

export const sendOtpEmail = async (options: OtpEmailOptions) => {
    const templateName = options.isArtist ? "artist-login-otp" : "customer-login-otp";
    return sendEmail(options.to, "Your Hive Access Code 🐝", templateName, { OTP: options.otpCode });
};

export type CustomerOrderConfirmationPayload = {
    OrderRef: string;
    OrderIdFull: string;
    Amount: string;
    Subtotal: string;
    Shipping: string;
    HasDiscount: boolean;
    Discount: string;
    LineItems: OrderEmailLineItem[];
    ShippingName?: string;
    ShippingLine1?: string;
    ShippingLine2?: string;
    ShippingCity?: string;
    ShippingState?: string;
    ShippingPostal?: string;
    ShippingCountry?: string;
    ShippingPhone?: string;
    OrdersUrl: string;
    ShopUrl: string;
};

export const sendOrderConfirmationEmail = async (
    to: string,
    name: string,
    orderData: CustomerOrderConfirmationPayload
) => {
    return sendEmail(to, "Order Confirmed – You supported a creator 🐝", "customer-order-confirmation", {
        Name: name,
        ...orderData,
    });
};

export const sendCustomerWelcomeEmail = async (to: string, name: string) => {
    const base = frontendBaseUrl();
    return sendEmail(to, "Welcome to the Hive 🐝", "customer-welcome", {
        Name: name,
        WebsiteLink: base,
        ShopUrl: `${base}/products`,
        ArtistsUrl: `${base}/artists`,
    });
};

export type AdminOrderNotificationPayload = {
    OrderRef: string;
    OrderIdFull: string;
    CustomerName: string;
    CustomerEmail: string;
    Amount: string;
    Subtotal: string;
    Shipping: string;
    HasDiscount: boolean;
    Discount: string;
    LineItems: OrderEmailLineItem[];
    ShippingName?: string;
    ShippingLine1?: string;
    ShippingLine2?: string;
    ShippingCity?: string;
    ShippingState?: string;
    ShippingPostal?: string;
    ShippingCountry?: string;
    ShippingPhone?: string;
    AdminPanelLink: string;
};

export const sendAdminOrderNotification = async (orderData: AdminOrderNotificationPayload) => {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@teehive.com";
    return sendEmail(adminEmail, "New order received", "admin-order-notification", orderData);
};

export const sendAdminReturnClaimNotification = async (claimData: {
    orderIdFull: string;
    orderRef: string;
    customerName: string;
    customerEmail: string;
    reason: string;
    description: string;
}) => {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@teehive.com";
    const base = frontendBaseUrl();
    const search = encodeURIComponent(claimData.orderIdFull);
    return sendEmail(adminEmail, "New return claim submitted", "admin-return-claim-notification", {
        OrderID: claimData.orderRef,
        OrderIdFull: claimData.orderIdFull,
        CustomerName: claimData.customerName,
        CustomerEmail: claimData.customerEmail,
        Reason: claimData.reason,
        Description: claimData.description,
        AdminPanelLink: `${base}/admin/orders?search=${search}`,
    });
};

export const sendArtistApprovalEmail = async (to: string, name: string) => {
    const base = frontendBaseUrl();
    return sendEmail(to, "Welcome to the Hive, Creator 🐝", "artist-welcome", {
        ArtistName: name,
        ArtistDashboard: `${base}/artist/dashboard`,
        ArtistOrders: `${base}/artist/orders`,
        ArtistProducts: `${base}/artist/manage-products`,
    });
};

export const sendArtistRejectionEmail = async (to: string, name: string, reason: string) => {
    const base = frontendBaseUrl();
    return sendEmail(to, "Update required before entering the Hive", "artist-design-rejected", {
        ArtistName: name,
        Reason: reason,
        ManageDesignsLink: `${base}/artist/manage-designs`,
        ArtistDashboard: `${base}/artist/dashboard`,
    });
};

export const sendForgotPasswordEmail = async (to: string, name: string, resetLink: string, isArtist: boolean) => {
    const templateName = isArtist ? "artist-forgot-password" : "customer-forgot-password";
    const data = isArtist ? { ArtistName: name, ResetLink: resetLink } : { Name: name, ResetLink: resetLink };
    return sendEmail(to, "Reset your Hive access 🔐", templateName, data);
};

export const sendFeedbackRequestEmail = async (to: string, name: string, orderId: string) => {
    const base = frontendBaseUrl();
    return sendEmail(to, "Help the Hive grow 🐝", "customer-feedback", {
        Name: name,
        FeedbackLink: `${base}/orders/${encodeURIComponent(orderId)}/rate`,
        OrdersUrl: `${base}/orders`,
    });
};

export type ArtistSaleLineItem = {
    Name: string;
    ProductUrl: string;
    Quantity: number;
    Size: string;
    Color: string;
    LineTotal: string;
};

export const sendArtistSaleNotificationEmail = async (
    to: string,
    artistName: string,
    data: {
        OrderRef: string;
        OrderIdFull: string;
        LineItems: ArtistSaleLineItem[];
        ArtistOrdersUrl: string;
        ArtistDashboardUrl: string;
    }
) => {
    return sendEmail(to, "Your work was purchased 🐝", "artist-sale-notification", {
        ArtistName: artistName,
        ...data,
    });
};

export const sendArtistPayoutEmail = async (to: string, artistName: string, amount: string, date: string) => {
    const base = frontendBaseUrl();
    return sendEmail(to, "Payout processed 💰", "artist-payout-processed", {
        ArtistName: artistName,
        Amount: amount,
        Date: date,
        EarningsLink: `${base}/artist/earnings`,
        DashboardLink: `${base}/artist/dashboard`,
    });
};

export const sendCustomEmail = async (to: string, subject: string, templateName: string, data: any) => {
    return sendEmail(to, subject, templateName, data);
};
