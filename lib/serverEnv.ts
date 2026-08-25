/** Read a server-side environment variable without exposing its value to the client. */
export function envValue(...keys: string[]): string {
  for (const key of keys) {
    const raw = process.env[key];
    if (typeof raw !== 'string') continue;

    // Vercel normally stores the value without quotes, but stripping one pair
    // makes copied .env values behave consistently.
    const value = raw.trim().replace(/^(["'])(.*)\1$/, '$2').trim();
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

/**
 * Admin authentication has exactly one source of truth in production:
 * ADMIN_SECRET_KEY.
 *
 * Do not add a fallback password here. A fallback makes a deployment appear
 * configured while authenticating against a value different from Vercel's
 * environment variable.
 */
export function adminSecrets() {
  const primary = envValue('ADMIN_SECRET_KEY');
  return {
    primary,
    configured: Boolean(primary),
    allowed: primary ? new Set([primary]) : new Set<string>(),
  };
}
