import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Goodwill Electrical World <onboarding@resend.dev>";
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "info@goodwillelectricalworld.com";
const SITE_URL = process.env.BETTER_AUTH_URL || process.env.URL || "http://localhost:3000";

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryType: string;
  shippingAddress: {
    name: string;
    phone: string;
    line1: string;
    city: string;
    pincode: string;
  };
  items: Array<{
    name: string;
    variantName?: string | null;
    price: number;
    quantity: number;
    total: number;
  }>;
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  gstAmount: number;
  total: number;
  paymentMethod: string;
}

/**
 * Send order confirmation email to the customer
 */
export async function sendOrderConfirmationEmail(order: OrderEmailData) {
  if (!resend) {
    console.warn("[Resend] RESEND_API_KEY is not set. Skipping customer order confirmation email.");
    return { success: false, error: "Resend not configured" };
  }

  if (!order.customerEmail) {
    return { success: false, error: "No customer email provided" };
  }

  const itemsHtml = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #1e293b;">
        <strong>${item.name}</strong>
        ${item.variantName ? `<br><span style="color: #64748b; font-size: 12px;">Variant: ${item.variantName}</span>` : ""}
      </td>
      <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #64748b; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #1e293b; text-align: right; font-weight: 600;">
        ₹${item.total.toLocaleString("en-IN")}
      </td>
    </tr>
  `
    )
    .join("");

  const trackingUrl = `${SITE_URL}/track-order?order=${order.orderNumber}&phone=${order.customerPhone}`;

  const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation - ${order.orderNumber}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 24px; text-align: center;">
          <h1 style="color: #f59e0b; margin: 0 0 6px 0; font-size: 22px; letter-spacing: 1px;">GOODWILL</h1>
          <p style="color: #94a3b8; margin: 0; font-size: 13px;">Electrical, Plumbing & Sanitary Wares</p>
        </div>

        <div style="padding: 32px 24px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="background-color: #ecfdf5; color: #059669; padding: 6px 14px; border-radius: 9999px; font-size: 13px; font-weight: 600; display: inline-block;">
              Order Confirmed ✓
            </span>
            <h2 style="color: #0f172a; margin: 16px 0 6px 0; font-size: 20px;">Thank you for your order, ${order.customerName}!</h2>
            <p style="color: #64748b; font-size: 14px; margin: 0;">Order #${order.orderNumber}</p>
          </div>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
            <thead>
              <tr style="border-bottom: 2px solid #e2e8f0;">
                <th style="text-align: left; padding-bottom: 8px; font-size: 12px; color: #64748b; text-transform: uppercase;">Item</th>
                <th style="text-align: center; padding-bottom: 8px; font-size: 12px; color: #64748b; text-transform: uppercase;">Qty</th>
                <th style="text-align: right; padding-bottom: 8px; font-size: 12px; color: #64748b; text-transform: uppercase;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Totals -->
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; color: #64748b;">
              <span>Subtotal:</span>
              <span>₹${order.subtotal.toLocaleString("en-IN")}</span>
            </div>
            ${
              order.discount > 0
                ? `<div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; color: #059669;">
                    <span>Discount:</span>
                    <span>-₹${order.discount.toLocaleString("en-IN")}</span>
                  </div>`
                : ""
            }
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; color: #64748b;">
              <span>Delivery (${order.deliveryType}):</span>
              <span>${order.deliveryCharge === 0 ? "FREE" : `₹${order.deliveryCharge.toLocaleString("en-IN")}`}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; color: #64748b;">
              <span>GST (Included):</span>
              <span>₹${order.gstAmount.toLocaleString("en-IN")}</span>
            </div>
            <div style="border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; color: #0f172a;">
              <span>Total Amount:</span>
              <span style="color: #d97706;">₹${order.total.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <!-- Shipping / Delivery Details -->
          <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 13px; color: #334155;">
            <strong style="color: #0f172a; display: block; margin-bottom: 6px;">Delivery Details:</strong>
            ${order.shippingAddress.name} | ${order.shippingAddress.phone}<br>
            ${order.shippingAddress.line1}, ${order.shippingAddress.city} - ${order.shippingAddress.pincode}<br>
            <span style="color: #64748b; font-size: 12px; margin-top: 4px; display: inline-block;">
              Payment Method: <strong>${order.paymentMethod.toUpperCase()}</strong>
            </span>
          </div>

          <!-- Button -->
          <div style="text-align: center; margin: 32px 0 16px 0;">
            <a href="${trackingUrl}" style="background-color: #0f172a; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
              Track Your Order
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b;">
          Goodwill Electrical World, Opp. Kulappully Bus Stand, Shoranur, Palakkad 679122<br>
          Phone: +91 97441 64444 | WhatsApp: +91 95445 54555
        </div>
      </div>
    </body>
  </html>
  `;

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [order.customerEmail],
      subject: `Order Confirmed: #${order.orderNumber} - Goodwill Electrical World`,
      html,
    });
    return { success: true, data };
  } catch (err: any) {
    console.error("[Resend] Error sending customer email:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send alert email to store admin on new order
 */
export async function sendAdminOrderAlert(order: OrderEmailData) {
  if (!resend) return { success: false, error: "Resend not configured" };

  const adminRecipient = process.env.ADMIN_NOTIFICATION_EMAIL || ADMIN_EMAIL;

  const html = `
    <h2>🚨 New Order Received: #${order.orderNumber}</h2>
    <p><strong>Customer:</strong> ${order.customerName} (${order.customerPhone})</p>
    <p><strong>Email:</strong> ${order.customerEmail || "Not provided"}</p>
    <p><strong>Delivery Type:</strong> ${order.deliveryType}</p>
    <p><strong>Total Amount:</strong> ₹${order.total.toLocaleString("en-IN")}</p>
    <p><strong>Payment:</strong> ${order.paymentMethod.toUpperCase()}</p>
    <p><strong>Address:</strong> ${order.shippingAddress.line1}, ${order.shippingAddress.city} - ${order.shippingAddress.pincode}</p>
    <hr />
    <p><a href="${SITE_URL}/admin/orders">View Order in Admin Dashboard</a></p>
  `;

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [adminRecipient],
      subject: `[New Order] #${order.orderNumber} - ₹${order.total.toLocaleString("en-IN")}`,
      html,
    });
    return { success: true, data };
  } catch (err: any) {
    console.error("[Resend] Error sending admin order alert:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send alert email to store admin on new bulk enquiry
 */
export async function sendEnquiryAlert(enquiry: {
  name: string;
  phone: string;
  email?: string | null;
  projectName?: string | null;
  requirement: string;
}) {
  if (!resend) return { success: false, error: "Resend not configured" };

  const adminRecipient = process.env.ADMIN_NOTIFICATION_EMAIL || ADMIN_EMAIL;

  const html = `
    <h2>📋 New Bulk/Contractor Quote Enquiry</h2>
    <p><strong>Name:</strong> ${enquiry.name}</p>
    <p><strong>Phone:</strong> <a href="tel:+91${enquiry.phone}">+91 ${enquiry.phone}</a> | <a href="https://wa.me/91${enquiry.phone}">WhatsApp</a></p>
    <p><strong>Email:</strong> ${enquiry.email || "Not provided"}</p>
    <p><strong>Project/Site:</strong> ${enquiry.projectName || "N/A"}</p>
    <p><strong>Requirement Details:</strong></p>
    <blockquote style="background: #f1f5f9; padding: 12px; border-left: 4px solid #f59e0b;">
      ${enquiry.requirement.replace(/\n/g, "<br>")}
    </blockquote>
    <p><a href="${SITE_URL}/admin/enquiries">Open Enquiries in Admin Panel</a></p>
  `;

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [adminRecipient],
      subject: `[New Quote Enquiry] ${enquiry.name} - ${enquiry.projectName || "General"}`,
      html,
    });
    return { success: true, data };
  } catch (err: any) {
    console.error("[Resend] Error sending enquiry alert:", err.message);
    return { success: false, error: err.message };
  }
}
