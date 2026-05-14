import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Allow build without env vars - use placeholder that will be replaced at runtime
const safeSupabaseUrl = supabaseUrl || 'https://placeholder.supabase.co';
const safeSupabaseAnonKey = supabaseAnonKey || 'placeholder-key';

export const supabase = createClient(safeSupabaseUrl, safeSupabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    // Don't fail requests during build
    fetch: (url, options) => {
      if (!supabaseUrl || !supabaseAnonKey) {
        return Promise.resolve(new Response(JSON.stringify({ error: 'Missing env vars' }), { status: 500 }));
      }
      return fetch(url, options);
    }
  }
});

export default supabase;