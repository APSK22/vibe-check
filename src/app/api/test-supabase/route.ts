import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;

    console.log('[Test] Checking configuration:');
    console.log('[Test] NEXT_PUBLIC_SUPABASE_URL exists:', !!supabaseUrl);
    console.log('[Test] NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!supabaseKey);
    console.log('[Test] GOOGLE_GEMINI_API_KEY exists:', !!geminiKey);

    // Get Clerk auth
    const { userId } = getAuth(req);
    console.log('[Test] Clerk auth userId:', userId);

    // Test Supabase connection
    console.log('[Test] Attempting to create Supabase client');
    try {
      const supabase = await createClient();
      console.log('[Test] Successfully created Supabase client');

      // Test basic query
      const { data, error } = await supabase.from('quizzes').select('count').limit(1);
      
      if (error) {
        console.error('[Test] Supabase query error:', error);
        return NextResponse.json({
          status: 'error',
          message: 'Failed to query Supabase',
          error: error.message,
          environmentCheck: {
            supabaseUrl: !!supabaseUrl,
            supabaseKey: !!supabaseKey,
            geminiKey: !!geminiKey
          },
          auth: {
            userId: userId || null
          }
        }, { status: 500 });
      }

      console.log('[Test] Successfully queried Supabase:', data);
      return NextResponse.json({
        status: 'success',
        message: 'Supabase connection successful',
        data,
        environmentCheck: {
          supabaseUrl: !!supabaseUrl,
          supabaseKey: !!supabaseKey,
          geminiKey: !!geminiKey
        },
        auth: {
          userId: userId || null
        }
      });
    } catch (connectionError) {
      console.error('[Test] Supabase connection error:', connectionError);
      return NextResponse.json({
        status: 'error',
        message: 'Failed to connect to Supabase',
        error: connectionError instanceof Error ? connectionError.message : String(connectionError),
        environmentCheck: {
          supabaseUrl: !!supabaseUrl,
          supabaseKey: !!supabaseKey,
          geminiKey: !!geminiKey
        },
        auth: {
          userId: userId || null
        }
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[Test] Error in test endpoint:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Server error during test',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 