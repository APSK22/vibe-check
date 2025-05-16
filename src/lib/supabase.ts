'use client';

import { createClient as supabaseCreateClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL or anon key is missing in environment variables');
}

// Custom hook to use Supabase with Clerk auth
export function useSupabase() {
  const { session } = useSession();
  const [supabase, setSupabase] = useState(() => 
    // Initial anonymous client
    supabaseCreateClient(supabaseUrl!, supabaseKey!)
  );
  
  useEffect(() => {
    if (session) {
      // Create a new client that will use the session for auth
      const supabaseClient = supabaseCreateClient(supabaseUrl!, supabaseKey!, {
        global: {
          fetch: undefined, // Use default fetch implementation
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
        async accessToken() {
          // Get the Clerk token when needed for Supabase
          const token = await session.getToken();
          return token || '';
        },
      });
      
      setSupabase(supabaseClient);
    }
  }, [session]);
  
  return supabase;
}

// For backwards compatibility
export const createClient = useSupabase; 