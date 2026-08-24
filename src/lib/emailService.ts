import { Resend } from 'resend';
import QRCode from 'qrcode';
import { SentEmailLog } from '../types';

export interface EmailPassData {
  userEmail: string;
  userName: string;
  userCollege?: string;
  userPhone?: string;
  eventTitle: string;
  eventCategory?: string;
  eventDay?: string;
  eventTime?: string;
  eventVenue?: string;
  ticketHash: string;
  receiptNumber: string;
  transactionId?: string;
  amountPaid: number;
  paymentGateway?: string;
  registeredAt?: string;
}

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (resendClient) return resendClient;
  const key = process.env.RESEND_API_KEY;
  if (key && !key.includes('placeholder')) {
    try {
      resendClient = new Resend(key);
      return resendClient;
    } catch (e) {
      console.warn('[Resend] Could not initialize Resend client:', e);
    }
  }
  return null;
}

export async function generateEventPassHTML(data: EmailPassData): Promise<string> {
  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(data.ticketHash, {
      margin: 1,
      width: 200,
      color: {
        dark: '#00ff66',
        light: '#030a05',
      },
    });
  } catch (err) {
    qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      data.ticketHash
    )}&color=00ff66&bcolor=030a05`;
  }

  const dateStr = data.registeredAt
    ? new Date(data.registeredAt).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : new Date().toLocaleDateString();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your IgniteX '26 Pass</title>
</head>
<body style="margin: 0; padding: 0; background-color: #030a05; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Courier New', monospace; color: #ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #030a05; padding: 20px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" max-width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #06120a; border: 2px solid #00ff66; border-radius: 16px; overflow: hidden; box-shadow: 0 0 30px rgba(0,255,102,0.3);">
          
          <!-- Header Branding -->
          <tr>
            <td style="background: linear-gradient(135deg, #020a04 0%, #081d0f 100%); padding: 25px 20px; border-bottom: 2px solid #00ff66; text-align: center;">
              <div style="font-size: 11px; color: #00ff66; letter-spacing: 2px; font-weight: bold; text-transform: uppercase;">NATIONAL LEVEL SYMPOSIUM</div>
              <h1 style="margin: 8px 0 4px 0; font-size: 26px; color: #ffffff; letter-spacing: 3px; text-transform: uppercase; font-weight: 900;">
                IGNITEX 2026
              </h1>
              <div style="display: inline-block; background-color: #064e3b; color: #34d399; border: 1px solid #10b981; font-size: 11px; font-weight: bold; padding: 4px 12px; border-radius: 6px; letter-spacing: 1px; text-transform: uppercase; margin-top: 5px;">
                ⚡ OFFICIAL REGISTRATION PASS
              </div>
            </td>
          </tr>

          <!-- Confirmation Banner -->
          <tr>
            <td style="background-color: #062b14; padding: 12px 20px; border-bottom: 1px solid #00ff66; text-align: center;">
              <span style="color: #00ff66; font-size: 13px; font-weight: bold; letter-spacing: 0.5px;">
                ✓ PAYMENT VERIFIED &amp; ENTRY CONFIRMED
              </span>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 25px 20px;">
              <p style="font-size: 14px; color: #e5e5e5; margin-top: 0;">
                Greetings <strong style="color: #00ff66;">${data.userName}</strong>,
              </p>
              <p style="font-size: 13px; color: #a3a3a3; line-height: 1.6;">
                Your official registration for <strong>${data.eventTitle}</strong> at <strong>IGNITEX 2026</strong> has been confirmed and verified. Below is your official entry ticket pass. Present this QR code or Registration ID at the entry gate.
              </p>

              <!-- Ticket Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #020a04; border: 1px dashed #00ff66; border-radius: 12px; margin: 20px 0; padding: 15px;">
                <tr>
                  <td align="center" style="padding-bottom: 15px;">
                    <img src="${qrDataUrl}" alt="Event Ticket QR Code" width="160" height="160" style="display: block; border: 2px solid #00ff66; border-radius: 8px; background-color: #030a05; padding: 5px;" />
                    <div style="font-size: 11px; color: #a3a3a3; margin-top: 8px; font-weight: bold; letter-spacing: 1px;">GATE ATTENDANCE QR PASS</div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="6" style="font-size: 12px; border-collapse: collapse;">
                      <tr style="border-bottom: 1px solid #14381e;">
                        <td style="color: #a3a3a3;">REGISTRATION ID:</td>
                        <td align="right" style="color: #00ff66; font-weight: bold; font-size: 14px; letter-spacing: 1px;">${data.ticketHash}</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #14381e;">
                        <td style="color: #a3a3a3;">RECEIPT NO:</td>
                        <td align="right" style="color: #f59e0b; font-weight: bold;">${data.receiptNumber}</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #14381e;">
                        <td style="color: #a3a3a3;">EVENT TITLE:</td>
                        <td align="right" style="color: #ffffff; font-weight: bold;">${data.eventTitle}</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #14381e;">
                        <td style="color: #a3a3a3;">DATE &amp; TIME:</td>
                        <td align="right" style="color: #ffffff;">${data.eventDay || 'Day 1'} • ${data.eventTime || '10:00 AM'}</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #14381e;">
                        <td style="color: #a3a3a3;">VENUE:</td>
                        <td align="right" style="color: #ffffff;">${data.eventVenue || 'Main Campus'}</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #14381e;">
                        <td style="color: #a3a3a3;">COLLEGE / INSTITUTION:</td>
                        <td align="right" style="color: #ffffff;">${data.userCollege || 'Participant College'}</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #14381e;">
                        <td style="color: #a3a3a3;">AMOUNT PAID:</td>
                        <td align="right" style="color: #00ff66; font-weight: bold; font-size: 14px;">₹${data.amountPaid} (${data.paymentGateway || 'UPI'})</td>
                      </tr>
                      <tr>
                        <td style="color: #a3a3a3;">TRANSACTION ID:</td>
                        <td align="right" style="color: #a3a3a3; font-family: monospace;">${data.transactionId || 'ONLINE_TXN'}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Event Instructions -->
              <div style="background-color: #091a0e; border-left: 4px solid #00ff66; padding: 12px 15px; border-radius: 4px; margin-bottom: 20px;">
                <div style="font-size: 11px; color: #00ff66; font-weight: bold; text-transform: uppercase;">⚠️ GATE INSTRUCTIONS &amp; CODE OF CONDUCT</div>
                <ul style="margin: 8px 0 0 0; padding-left: 18px; font-size: 12px; color: #d4d4d4; line-height: 1.5;">
                  <li>Keep this digital pass saved on your smartphone or carry a printed copy.</li>
                  <li>College ID card is mandatory at the security desk for identity verification.</li>
                  <li>Scan your QR code at the registration desk for instant entry.</li>
                </ul>
              </div>

              <!-- Support Note -->
              <p style="font-size: 11px; color: #737373; text-align: center; margin: 0;">
                Questions regarding your pass? Reach out to the Symposium desk directly.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #020a04; padding: 15px 20px; border-top: 1px solid #14381e; text-align: center; font-size: 10px; color: #525252;">
              © 2026 IGNITEX Symposium. All rights reserved.<br/>
              Automated Notification System • Do Not Reply Directly
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export async function sendAutomatedPassEmail(data: EmailPassData): Promise<{
  success: boolean;
  message: string;
  log: SentEmailLog;
}> {
  const html = await generateEventPassHTML(data);
  const subject = `🔥 [IGNITEX 2026 PASS] ${data.eventTitle} - ID #${data.ticketHash}`;

  const emailLog: SentEmailLog = {
    id: `EML-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    to: data.userEmail,
    recipientEmail: data.userEmail,
    recipientName: data.userName,
    subject,
    eventTitle: data.eventTitle,
    ticketHash: data.ticketHash,
    receiptNumber: data.receiptNumber,
    amountPaid: data.amountPaid,
    sentAt: new Date().toISOString(),
    status: 'RECORDED',
    htmlContent: html,
  };

  const resend = getResendClient();
  if (resend) {
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'IgniteX 2026 <onboarding@resend.dev>';
      const res = await resend.emails.send({
        from: fromEmail,
        to: data.userEmail,
        subject,
        html,
      });

      if (res.error) {
        console.warn('[Resend] Delivery warning:', res.error);
        emailLog.status = 'RECORDED';
      } else {
        console.log(`[Resend] Successfully dispatched pass email to ${data.userEmail}, ID: ${res.data?.id}`);
        emailLog.status = 'DELIVERED';
      }
    } catch (err: any) {
      console.warn('[Resend] Exception dispatching email via Resend API:', err.message || err);
      emailLog.status = 'RECORDED';
    }
  } else {
    console.log(`[PASS DISPATCH] Automated event pass generated and recorded locally for ${data.userEmail}.`);
  }

  return {
    success: true,
    message: `Automated pass generated & recorded for ${data.userEmail}.`,
    log: emailLog,
  };
}
