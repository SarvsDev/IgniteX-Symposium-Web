export function envValue(...keys: string[]): string {
  for (const key of keys) {
    const raw = process.env[key];
    if (typeof raw !== 'string') continue;
    const value = raw.trim().replace(/^["']|["']$/g, '').trim();
    if (value) return value;
  }
  return '';
}

export function supabaseConfig() {
  const url = envValue('SUPABASE_URL', 'VITE_SUPABASE_URL');
  const serviceRoleKey = envValue('SUPABASE_SERVICE_ROLE_KEY');
  const configured = Boolean(
    url.startsWith('http') &&
    serviceRoleKey &&
    !url.includes('YOUR_PROJECT') &&
    !serviceRoleKey.includes('YOUR_')
  );

  const missing: string[] = [];
  if (!url) missing.push('SUPABASE_URL');
  if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');

  return { url, serviceRoleKey, configured, missing };
}

export function adminSecrets() {
  const primary = envValue('ADMIN_SECRET_KEY');
  return {
    primary,
    configured: Boolean(primary),
    allowed: new Set(primary ? [primary] : []),
  };
}
