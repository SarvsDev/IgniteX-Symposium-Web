import { adminSecrets, envValue, supabaseConfig } from '../lib/serverEnv.js';

export default async function handler(_req: any, res: any) {
  try {
    const supabase = supabaseConfig();
    const admin = adminSecrets();
    return res.status(200).json({
      supabaseUrlConfigured: Boolean(supabase.url),
      supabaseServiceRoleConfigured: Boolean(supabase.serviceRoleKey),
      gmailSmtpConfigured: Boolean(envValue('GMAIL_SMTP_USER', 'SMTP_USER', 'GMAIL_USER') && envValue('GMAIL_SMTP_APP_PASSWORD', 'SMTP_PASS', 'GMAIL_APP_PASSWORD')),
      gmailSmtpUserConfigured: Boolean(envValue('GMAIL_SMTP_USER', 'SMTP_USER', 'GMAIL_USER')),
      gmailSmtpAppPasswordConfigured: Boolean(envValue('GMAIL_SMTP_APP_PASSWORD', 'SMTP_PASS', 'GMAIL_APP_PASSWORD')),
      appUrlConfigured: Boolean(envValue('APP_URL') || process.env.VERCEL_URL),
      adminSecretConfigured: admin.configured,
      missing: supabase.missing,
    });
  } catch (error: any) {
    console.error('[api/config-status]', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Configuration check failed.',
    });
  }
}
