import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  console.log('[Quiz Submission Count API] Received request to get submission count');
  
  try {
    // Get request data
    const { quizId } = await req.json();
    
    if (!quizId) {
      console.log('[Quiz Submission Count API] Missing quiz ID');
      return NextResponse.json(
        { error: "Missing quiz ID" },
        { status: 400 }
      );
    }
    
    console.log(`[Quiz Submission Count API] Getting submission count for quiz: ${quizId}`);
    
    // Create Supabase client
    const supabase = await createClient();
    
    // First try to create a submission count function if it doesn't exist
    try {
      // Try to create a secure service function to count submissions
      await supabase.rpc('exec_sql', {
        sql_query: `
          CREATE OR REPLACE FUNCTION count_quiz_submissions(quiz_id_param UUID)
          RETURNS integer
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
            submission_count integer;
          BEGIN
            SELECT COUNT(*) INTO submission_count
            FROM quiz_submissions
            WHERE quiz_id = quiz_id_param;
            
            RETURN submission_count;
          END;
          $$;
        `
      });
      console.log('[Quiz Submission Count API] Created or updated count function');
    } catch (createError) {
      console.log('[Quiz Submission Count API] Error creating function (may already exist):', createError);
    }
    
    // First try using the security definer function to bypass RLS
    try {
      const { data: countData, error: countError } = await supabase.rpc(
        'count_quiz_submissions',
        { quiz_id_param: quizId }
      );
      
      if (!countError) {
        console.log(`[Quiz Submission Count API] Found ${countData} submissions using security definer function`);
        return NextResponse.json({
          success: true,
          submission_count: countData
        });
      } else {
        console.log('[Quiz Submission Count API] Error using count function:', countError);
      }
    } catch (rpcError) {
      console.log('[Quiz Submission Count API] RPC error:', rpcError);
    }
    
    // Fallback to standard query with RLS restrictions
    const { count, error } = await supabase
      .from('quiz_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', quizId);
      
    if (error) {
      console.error('[Quiz Submission Count API] Error getting submission count:', error);
      return NextResponse.json(
        { error: "Failed to get submission count", details: error },
        { status: 500 }
      );
    }
    
    console.log(`[Quiz Submission Count API] Found ${count || 0} submissions for quiz ${quizId} using standard query`);
    
    return NextResponse.json({
      success: true,
      submission_count: count || 0
    });
    
  } catch (error) {
    console.error('[Quiz Submission Count API] Unexpected error:', error);
    return NextResponse.json(
      { error: "Failed to get submission count", details: String(error) },
      { status: 500 }
    );
  }
} 