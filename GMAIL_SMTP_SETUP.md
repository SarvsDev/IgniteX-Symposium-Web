# Gmail SMTP Setup — IgniteX 2026

This version removes Resend and sends approval/pass emails through Gmail SMTP using Nodemailer. Gmail credentials stay server-side in Vercel.

## Step 1 — Use a dedicated Gmail account
Create/use an account such as `ignitex2026@gmail.com`. A dedicated event account is strongly recommended.

## Step 2 — Enable 2-Step Verification
1. Open https://myaccount.google.com/security
2. Under **How you sign in to Google**, open **2-Step Verification**.
3. Complete Google's setup.

Google requires 2-Step Verification before App Passwords can be created.

## Step 3 — Create the Google App Password
1. Open **Google Account → Security**.
2. Open **App passwords**.
3. Sign in again if requested.
4. Enter a label such as `IgniteX Vercel SMTP`.
5. Click **Create**.
6. Copy the generated 16-character App Password immediately.

Use the App Password, **not your normal Gmail password**. Google notes that App Passwords require 2-Step Verification.

## Step 4 — Add Vercel environment variables
In **Vercel → Project → Settings → Environment Variables**, add these for Production:

```text
GMAIL_SMTP_USER=your-sending-account@gmail.com
GMAIL_SMTP_APP_PASSWORD=xxxx xxxx xxxx xxxx
GMAIL_SMTP_FROM_NAME=IgniteX 2026
```

You can paste the App Password with or without spaces.

## Step 5 — Remove old email-provider variables
Delete old variables if present:

```text
RESEND_API_KEY
RESEND_FROM_EMAIL
RESEND_TEST_MODE
RESEND_TEST_RECIPIENT
```

These old variables are no longer used by the application; remove them from Vercel if they are present.

## Step 6 — Redeploy Vercel
Create a new deployment after saving the environment variables.

## Step 7 — Verify configuration
Open `/api/config-status` on the deployed site. You should see:

```json
{
  "gmailSmtpConfigured": true,
  "gmailSmtpUserConfigured": true,
  "gmailSmtpAppPasswordConfigured": true
}
```

## Step 8 — Test an approval email
Approve a test registration from the admin panel. The email will be sent to the participant's actual email address from the Gmail account configured above.

## SMTP details
Nodemailer uses Gmail's service preset. Gmail documents `smtp.gmail.com`, with port 587 for TLS or 465 for SSL.

## If App passwords is unavailable
Google says the App passwords option may be unavailable for some work/school accounts, accounts with Advanced Protection, or accounts where 2-Step Verification is configured only with security keys. In that situation, use a dedicated personal Gmail account or Gmail OAuth 2.0.

## Security
Never use `VITE_GMAIL_SMTP_APP_PASSWORD`, never commit the App Password to GitHub, and never put it in client-side code.
