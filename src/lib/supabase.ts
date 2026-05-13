import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Singleton para o cliente Supabase
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase environment variables are not configured');
      // Retorna um cliente com valores dummy para desenvolvimento
      _supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
      return _supabase;
    }
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

// Proxy para manter compatibilidade com código existente (supabase.from())
const supabaseProxy = new Proxy(
  {},
  {
    get(_, prop) {
      const client = getSupabase();
      // Mapeia todos os métodos para o cliente real
      if (prop === 'from') {
        return (table: string) => client.from(table);
      }
      if (prop === 'auth') {
        return client.auth;
      }
      if (prop === 'storage') {
        return client.storage;
      }
      if (prop === 'channel') {
        return client.channel;
      }
      return (client as any)[prop];
    },
  }
) as SupabaseClient;

export const supabase = supabaseProxy;
export default supabase;