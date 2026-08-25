import { createClient } from '@supabase/supabase-js';
import { adminSecrets, supabaseConfig } from '../lib/serverEnv';

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export default async function handler(req: any, res: any) {
  res.setHeader?.('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Use GET /api/db-test.' } });
  }

  const { configured: adminConfigured, allowed } = adminSecrets();
  const supplied = text(req.headers?.['x-admin-key']);
  if (!adminConfigured || !supplied || !allowed.has(supplied)) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Admin key required.' } });
  }

  const config = supabaseConfig();
  if (!config.configured) {
    return res.status(503).json({
      success: false,
      database: 'not_configured',
      missing: config.missing,
      message: 'Supabase server configuration is incomplete.',
    });
  }

  try {
    const client = createClient(config.url, config.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await client.from('events').select('id,slug,title').limit(1);

    if (error) {
      return res.status(503).json({
        success: false,
        database: 'error',
        message: error.message,
        code: error.code || null,
      });
    }

    return res.status(200).json({
      success: true,
      database: 'connected',
      sampleRows: data?.length ?? 0,
    });
  } catch (error: any) {
    console.error('[DB Test]', error);
    return res.status(500).json({
      success: false,
      database: 'error',
      message: error?.message || 'Database connection failed.',
    });
  }
}
