import { createClient } from '@supabase/supabase-js';
import { envValue, supabaseConfig } from '../lib/serverEnv.js';

export default async function handler(_req: any, res: any) {
  try {
    const { url, serviceRoleKey, configured, missing } = supabaseConfig();
    const gmailSmtpConfigured = Boolean(envValue('GMAIL_SMTP_USER', 'SMTP_USER', 'GMAIL_USER') && envValue('GMAIL_SMTP_APP_PASSWORD', 'SMTP_PASS', 'GMAIL_APP_PASSWORD'));

    if (!configured) {
      return res.status(503).json({
        status: 'degraded',
        database: 'not_configured',
        gmailSmtp: gmailSmtpConfigured,
        missing,
        error: `Missing ${missing.join(' and ') || 'Supabase server variables'} in the Vercel project environment.`,
        timestamp: new Date().toISOString(),
      });
    }

    const client = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error } = await client.from('events').select('id').limit(1);

    return res.status(error ? 503 : 200).json({
      status: error ? 'degraded' : 'ok',
      database: error ? 'error' : 'supabase',
      gmailSmtp: gmailSmtpConfigured,
      error: error?.message || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[api/health]', error);
    return res.status(500).json({
      status: 'error',
      database: 'error',
      error: error?.message || 'Database health check failed.',
      timestamp: new Date().toISOString(),
    });
  }
}
