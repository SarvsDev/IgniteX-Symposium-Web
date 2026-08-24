import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};
export const supabaseUrl = String(env.VITE_SUPABASE_URL || '');
export const supabaseAnonKey = String(env.VITE_SUPABASE_ANON_KEY || '');

export const isSupabaseConfigured = Boolean(
  supabaseUrl.startsWith('http') &&
  supabaseAnonKey &&
  !supabaseUrl.includes('YOUR_') &&
  !supabaseAnonKey.includes('YOUR_')
);

// This client is optional for public event reads. All privileged operations go through /api/*.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } })
  : null;
