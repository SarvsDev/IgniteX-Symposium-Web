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
  const configured = envValue('ADMIN_SECRET_KEY');
  const fallback = 'doomsday_admin_2026';
  const legacy = '8f497bab15055497e0e870561ab2706b';
  return {
    primary: configured || fallback,
    configured: Boolean(configured),
    allowed: new Set([configured || fallback, legacy].filter(Boolean)),
  };
}
