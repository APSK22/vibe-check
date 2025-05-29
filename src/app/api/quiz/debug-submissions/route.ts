import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  console.log('[Debug Submissions API] Received request to debug submissions');
  
  try {
    // Check authentication
    const { userId } = getAuth(req);
    console.log('[Debug Submissions API] User ID:', userId || 'not authenticated');
    
    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to debug submissions" },
        { status: 401 }
      );
    }
    
    // Get request data
    const { quizId } = await req.json();
    
    if (!quizId) {
      console.log('[Debug Submissions API] Missing quiz ID');
      return NextResponse.json(
        { error: "Missing quiz ID" },
        { status: 400 }
      );
    }
    
    console.log(`[Debug Submissions API] Debugging submissions for quiz: ${quizId}`);
    
    // Create Supabase client
    const supabase = await createClient();
    
    // 1. First check if the quiz exists
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();
      
    if (quizError) {
      console.error('[Debug Submissions API] Error finding quiz:', quizError);
      return NextResponse.json(
        { error: "Failed to find quiz", details: quizError },
        { status: 404 }
      );
    }
    
    // 2. Check all submissions for this quiz (without filters)
    const { data: allSubmissions, error: allSubmissionsError, count: totalCount } = await supabase
      .from('quiz_submissions')
      .select('*', { count: 'exact' })
      .eq('quiz_id', quizId);
      
    if (allSubmissionsError) {
      console.error('[Debug Submissions API] Error getting all submissions:', allSubmissionsError);
    }
    
    // 3. Check current user's submissions
    const { data: userSubmissions, error: userSubmissionsError, count: userCount } = await supabase
      .from('quiz_submissions')
      .select('*', { count: 'exact' })
      .eq('quiz_id', quizId)
      .eq('user_id', userId);
      
    if (userSubmissionsError) {
      console.error('[Debug Submissions API] Error getting user submissions:', userSubmissionsError);
    }
    
    // 4. Check using direct count query
    const { count: directCount, error: countError } = await supabase
      .from('quiz_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', quizId);
    
    // 5. Check SQL policies affecting this table
    const { data: policies, error: policiesError } = await supabase
      .rpc('debug_get_policies', { table_name: 'quiz_submissions' });
    
    return NextResponse.json({
      success: true,
      quiz_id: quizId,
      user_id: userId,
      quiz_owner: quiz.created_by,
      is_owner: userId === quiz.created_by,
      total_submissions: {
        count: totalCount,
        records: allSubmissions,
        error: allSubmissionsError ? String(allSubmissionsError) : null
      },
      user_submissions: {
        count: userCount,
        records: userSubmissions,
        error: userSubmissionsError ? String(userSubmissionsError) : null
      },
      direct_count: {
        count: directCount,
        error: countError ? String(countError) : null
      },
      policies: {
        data: policies,
        error: policiesError ? String(policiesError) : null
      }
    });
    
  } catch (error) {
    console.error('[Debug Submissions API] Unexpected error:', error);
    return NextResponse.json(
      { error: "Failed to debug submissions", details: String(error) },
      { status: 500 }
    );
  }
} 