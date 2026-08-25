function envValue(...keys: string[]): string {
  for (const key of keys) {
    const raw = process.env[key];
    if (typeof raw !== 'string') continue;
    const value = raw.trim().replace(/^(["'])(.*)\1$/, '$2').trim();
    if (value) return value;
  }
  return '';
}

export default function handler(_req: any, res: any) {
  const adminSecret = envValue('ADMIN_SECRET_KEY');
  const supabaseUrl = envValue('SUPABASE_URL', 'VITE_SUPABASE_URL');
  const supabaseServiceRoleKey = envValue('SUPABASE_SERVICE_ROLE_KEY');
  const resendKey = envValue('RESEND_API_KEY');
  const resendFrom = envValue('RESEND_FROM_EMAIL');

  res.status(200).json({
    adminSecretConfigured: Boolean(adminSecret),
    adminSecretLength: adminSecret.length,
    supabaseUrlConfigured: Boolean(supabaseUrl),
    supabaseServiceRoleConfigured: Boolean(supabaseServiceRoleKey),
    resendConfigured: Boolean(resendKey),
    resendFromConfigured: Boolean(resendFrom),
  });
}
