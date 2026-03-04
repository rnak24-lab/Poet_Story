import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Client-side Supabase client
// Returns null if env vars are not configured
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

// For backward compatibility
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as unknown as SupabaseClient);

// Server-side Supabase client (API routes - service_role key)
// Reads env vars at call time to ensure they're available at runtime (not just build time)
// Caches the instance after first successful creation
let _serverSupabase: SupabaseClient | null = null;
let _serverSupabaseChecked = false;

export function createServerSupabase(): SupabaseClient | null {
  if (_serverSupabaseChecked && _serverSupabase) return _serverSupabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error('createServerSupabase: missing env vars', {
      hasUrl: !!url,
      urlLength: url?.length || 0,
      hasServiceKey: !!serviceKey,
    });
    _serverSupabaseChecked = true;
    return null;
  }
  _serverSupabase = createClient(url, serviceKey);
  _serverSupabaseChecked = true;
  return _serverSupabase;
}
