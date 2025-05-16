import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

// Create a server-side Supabase client using environment variables
export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[Supabase] Missing URL or key in environment variables');
    throw new Error('Supabase URL or anon key is not defined');
  }

  try {
    return createSupabaseClient(supabaseUrl, supabaseKey, {
      global: {
        fetch: undefined, // Use default fetch implementation
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      async accessToken() {
        // Get token from Clerk
        const authObject = await auth();
        const token = await authObject.getToken();
        return token || '';
      },
    });
  } catch (error) {
    console.error('[Supabase] Error creating client:', error);
    
    // Fallback to unauthenticated client if auth fails
    const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
    console.log('[Supabase] Fallback client created without authentication');
    return supabase;
  }
} 