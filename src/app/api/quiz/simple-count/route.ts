import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  console.log('[Simple Count API] Received request to count submissions');
  
  try {
    // Check authentication
    const { userId } = getAuth(req);
    console.log('[Simple Count API] User ID:', userId || 'not authenticated');
    
    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to count submissions" },
        { status: 401 }
      );
    }
    
    // Get request data
    const { quizId } = await req.json();
    
    if (!quizId) {
      console.log('[Simple Count API] Missing quiz ID');
      return NextResponse.json(
        { error: "Missing quiz ID" },
        { status: 400 }
      );
    }
    
    // Create regular Supabase client first
    const supabase = await createClient();
    
    // First try with the regular client - this will work if the current user can access this quiz
    try {
      const { count, error } = await supabase
        .from('quiz_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', quizId);
      
      if (!error) {
        console.log(`[Simple Count API] Found ${count} submissions via regular client`);
        return NextResponse.json({
          success: true,
          count: count || 0
        });
      }
    } catch (regularError) {
      console.log('[Simple Count API] Regular client count failed:', regularError);
    }
    
    // If regular client fails (due to RLS), use admin client
    try {
      const adminClient = await createAdminClient();
      
      const { count, error } = await adminClient
        .from('quiz_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', quizId);
      
      if (error) {
        throw error;
      }
      
      console.log(`[Simple Count API] Found ${count} submissions via admin client`);
      
      return NextResponse.json({
        success: true,
        count: count || 0
      });
    } catch (adminError) {
      console.error('[Simple Count API] Admin client count error:', adminError);
      
      // If all else fails, return 0
      return NextResponse.json({
        success: true,
        count: 0,
        note: "Failed to get accurate count"
      });
    }
  } catch (error) {
    console.error('[Simple Count API] Unexpected error:', error);
    return NextResponse.json(
      { error: "Failed to count submissions", details: String(error) },
      { status: 500 }
    );
  }
} 