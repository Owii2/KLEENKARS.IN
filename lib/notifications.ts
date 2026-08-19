import nodemailer from "nodemailer";

export interface NotificationParams {
  bookingId: string;
  customerName: string;
  phoneNumber: string;
  vehicleType: string;
  serviceType: string;
  addons?: string[];
  pickupDrop: boolean;
  pickupAddress?: string;
  bookingDate: string;
  bookingTime: string;
  totalCost: number;
  paymentMode?: string;
  notes?: string;
}

export function buildWhatsAppMessage(params: NotificationParams): string {
  const timeStr = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  let text = `🚗 *NEW KLEENKARS BOOKING CONFIRMED*\n`;
  text += `===============================\n`;
  text += `🆔 *Booking ID:* ${params.bookingId}\n`;
  text += `👤 *Customer Name:* ${params.customerName}\n`;
  text += `📱 *Phone Number:* ${params.phoneNumber}\n`;
  text += `🚘 *Vehicle Type:* ${params.vehicleType}\n`;
  text += `🧼 *Service Package:* ${params.serviceType}\n`;
  if (params.addons && params.addons.length > 0) {
    text += `➕ *Add-ons:* ${params.addons.join(", ")}\n`;
  }
  text += `📅 *Date:* ${params.bookingDate}\n`;
  text += `🕒 *Time:* ${params.bookingTime}\n`;
  text += `💰 *Total Amount:* ₹${params.totalCost} (${params.paymentMode || "Cash"})\n`;
  text += `🚗 *Doorstep Pickup:* ${params.pickupDrop ? "Yes (Rs 100)" : "No (Studio Visit)"}\n`;

  if (params.pickupDrop && params.pickupAddress) {
    text += `📍 *Pickup Address:* ${params.pickupAddress}\n`;
  }
  if (params.notes) {
    text += `📝 *Notes:* ${params.notes}\n`;
  }

  text += `\nSubmitted at ${timeStr}. Please confirm slot and assign staff!`;

  return text;
}

export function buildWhatsAppUrl(params: NotificationParams, ownerNumber = "918650007661"): string {
  const text = buildWhatsAppMessage(params);
  return `https://wa.me/${ownerNumber}?text=${encodeURIComponent(text)}`;
}

export async function sendEmailNotification(params: NotificationParams) {
  const recipientEmail = process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER || "info@kleenkars.in";
  
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || "587");
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #050507; color: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid #27272a;">
      <div style="border-bottom: 2px solid #ef4444; padding-bottom: 16px; margin-bottom: 20px;">
        <h2 style="color: #ef4444; margin: 0; font-size: 24px;">🚗 New Booking Confirmed</h2>
        <p style="color: #a1a1aa; font-size: 13px; margin-top: 4px;">Kleenkars Car Detailing & Wash Studio</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 8px 0; color: #a1a1aa; font-size: 14px;">Booking Reference:</td>
          <td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right; color: #ffffff;">#${params.bookingId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #a1a1aa; font-size: 14px;">Customer Name:</td>
          <td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right; color: #ffffff;">${params.customerName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #a1a1aa; font-size: 14px;">Phone Number:</td>
          <td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right; color: #ef4444;"><a href="tel:${params.phoneNumber}" style="color: #ef4444; text-decoration: none;">${params.phoneNumber}</a></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #a1a1aa; font-size: 14px;">Vehicle & Service:</td>
          <td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right; color: #ffffff;">${params.vehicleType} - ${params.serviceType}</td>
        </tr>
        ${params.addons && params.addons.length > 0 ? `
        <tr>
          <td style="padding: 8px 0; color: #a1a1aa; font-size: 14px;">Add-ons:</td>
          <td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right; color: #ffffff;">${params.addons.join(", ")}</td>
        </tr>` : ''}
        <tr>
          <td style="padding: 8px 0; color: #a1a1aa; font-size: 14px;">Date & Time Slot:</td>
          <td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right; color: #ffffff;">${params.bookingDate} at ${params.bookingTime}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #a1a1aa; font-size: 14px;">Doorstep Pickup:</td>
          <td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right; color: ${params.pickupDrop ? '#10b981' : '#a1a1aa'};">${params.pickupDrop ? 'Yes (Rs 100)' : 'No (Studio Visit)'}</td>
        </tr>
        ${params.pickupDrop && params.pickupAddress ? `
        <tr>
          <td style="padding: 8px 0; color: #a1a1aa; font-size: 14px;">Pickup Address:</td>
          <td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right; color: #ffffff;">${params.pickupAddress}</td>
        </tr>` : ''}
        <tr style="border-top: 1px solid #27272a;">
          <td style="padding: 12px 0 8px 0; font-size: 16px; font-weight: bold; color: #ffffff;">Total Amount:</td>
          <td style="padding: 12px 0 8px 0; font-size: 20px; font-weight: bold; text-align: right; color: #ef4444;">₹${params.totalCost}</td>
        </tr>
      </table>

      <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #27272a;">
        <a href="https://wa.me/${params.phoneNumber.replace(/\+/g, '')}" style="display: inline-block; background-color: #25D366; color: #000000; font-weight: bold; font-size: 13px; text-decoration: none; padding: 12px 24px; border-radius: 12px;">
          💬 Reply to Customer on WhatsApp
        </a>
      </div>
    </div>
  `;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"Kleenkars Bookings" <${smtpUser}>`,
        to: recipientEmail,
        subject: `🚗 New Booking #${params.bookingId} - ${params.customerName} (${params.serviceType})`,
        html: htmlContent,
      });

      console.log(`Email alert sent successfully for booking #${params.bookingId} to ${recipientEmail}`);
      return { success: true };
    } catch (err) {
      console.error("Failed to send email alert via SMTP:", err);
      return { success: false, error: err };
    }
  } else {
    console.log("SMTP credentials not set in environment variables. Email notification prepared.");
    return { success: false, reason: "SMTP credentials missing" };
  }
}
