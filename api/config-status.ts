import { adminSecrets, envValue, supabaseConfig } from '../lib/serverEnv.js';

export default async function handler(_req: any, res: any) {
  try {
    const supabase = supabaseConfig();
    const admin = adminSecrets();
    return res.status(200).json({
      supabaseUrlConfigured: Boolean(supabase.url),
      supabaseServiceRoleConfigured: Boolean(supabase.serviceRoleKey),
      resendConfigured: Boolean(envValue('RESEND_API_KEY')),
      resendFromConfigured: Boolean(envValue('RESEND_FROM_EMAIL')),
      resendTestMode: ['1','true','yes','on'].includes(envValue('RESEND_TEST_MODE').toLowerCase()),
      resendTestRecipientConfigured: Boolean(envValue('RESEND_TEST_RECIPIENT')),
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
