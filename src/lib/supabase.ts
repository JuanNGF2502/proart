import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase environment variables are not configured');
    }
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

export const supabase = {
  get client() {
    return getSupabase();
  }
} as unknown as SupabaseClient;

export default supabase;