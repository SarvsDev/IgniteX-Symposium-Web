import { createClient } from '@supabase/supabase-js';
import { envValue, supabaseConfig } from '../lib/serverEnv';

export default async function handler(_req: any, res: any) {
  const { url, serviceRoleKey, configured, missing } = supabaseConfig();
  const resendConfigured = Boolean(envValue('RESEND_API_KEY'));

  if (!configured) {
    res.status(503).json({
      status: 'degraded',
      database: 'not_configured',
      resend: resendConfigured,
      missing,
      error: `Missing ${missing.join(' and ')} in the Vercel project environment.`,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const client = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.from('events').select('id').limit(1);

  res.status(error ? 503 : 200).json({
    status: error ? 'degraded' : 'ok',
    database: error ? 'error' : 'supabase',
    resend: resendConfigured,
    error: error?.message || null,
    timestamp: new Date().toISOString(),
  });
}
