import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fmralzffbblnpsvetkjb.supabase.co';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    'sb_publishable_C_4SU_qRcipPILTNatt6Jw_uG7tWarL';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
