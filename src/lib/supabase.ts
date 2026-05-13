import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let client: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (!client) {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase: variáveis de ambiente não configuradas');
      client = createClient('https://placeholder.supabase.co', 'placeholder-key');
    } else {
      client = createClient(supabaseUrl, supabaseAnonKey);
    }
  }
  return client;
}

// Objeto proxy para suportar supabase.from()
const supabase = {
  from(table: string) {
    return getClient().from(table);
  },
  auth: {
    getSession: () => getClient().auth.getSession(),
    getUser: () => getClient().auth.getUser(),
    signInWithPassword: (credentials: any) => getClient().auth.signInWithPassword(credentials),
    signUp: (options: any) => getClient().auth.signUp(options),
    signOut: () => getClient().auth.signOut(),
    resetPasswordForEmail: (email: string, options?: any) => getClient().auth.resetPasswordForEmail(email, options),
    onAuthStateChange: (callback: any) => getClient().auth.onAuthStateChange(callback),
  },
  channel: (name: string) => getClient().channel(name),
  removeChannel: (channel: any) => getClient().removeChannel(channel),
  storage: (name: string) => getClient().storage(name),
  rpc: (fn: string, params: any) => getClient().rpc(fn, params),
};

export default supabase;
export { supabase };