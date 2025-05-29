import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  console.log('[Quiz Get Attempts API] Received request to get user attempts');
  
  try {
    // Check authentication
    const { userId } = getAuth(req);
    console.log('[Quiz Get Attempts API] User ID:', userId || 'not authenticated');
    
    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to view your attempts" },
        { status: 401 }
      );
    }
    
    // Create Supabase admin client to bypass RLS
    const supabase = await createAdminClient();
    
    // First, fetch all quiz submissions for this user
    const { data: submissionsData, error: submissionsError } = await supabase
      .from('quiz_submissions')
      .select(`
        id,
        quiz_id,
        completed_at,
        score,
        max_score,
        user_id
      `)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });
    
    if (submissionsError) {
      console.error('[Quiz Get Attempts API] Error fetching submissions:', submissionsError);
      return NextResponse.json(
        { error: "Failed to load your quiz attempts" },
        { status: 500 }
      );
    }
    
    if (!submissionsData || submissionsData.length === 0) {
      console.log('[Quiz Get Attempts API] No quiz submissions found');
      return NextResponse.json({ success: true, attempts: [] });
    }
    
    console.log(`[Quiz Get Attempts API] Found ${submissionsData.length} quiz submissions`);
    
    // Fetch quiz details for all quiz_ids in one go
    const quizIds = submissionsData.map(sub => sub.quiz_id);
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .select('id, title, description, quiz_type')
      .in('id', quizIds);
    
    if (quizError) {
      console.error('[Quiz Get Attempts API] Error fetching quiz details:', quizError);
    }
    
    // Create a map of quiz details for efficient lookup
    const quizMap = new Map();
    if (quizData) {
      quizData.forEach(quiz => {
        quizMap.set(quiz.id, quiz);
      });
    }
    
    // Fetch vibe results for all submissions in one go
    const submissionIds = submissionsData.map(sub => sub.id);
    const { data: vibeData, error: vibeError } = await supabase
      .from('vibe_results')
      .select('submission_id, vibe_analysis, vibe_categories')
      .in('submission_id', submissionIds);
    
    if (vibeError) {
      console.log('[Quiz Get Attempts API] Error fetching vibe results:', vibeError);
    }
    
    // Create a map of vibe results for efficient lookup
    const vibeMap = new Map();
    if (vibeData) {
      vibeData.forEach(vibe => {
        vibeMap.set(vibe.submission_id, vibe);
      });
    }
    
    // Combine all the data
    const combinedAttempts = submissionsData.map(submission => {
      const quiz = quizMap.get(submission.quiz_id) || { 
        title: "Unknown Quiz", 
        description: "", 
        quiz_type: "scored" 
      };
      
      const vibe = vibeMap.get(submission.id);
      
      return {
        id: submission.id,
        quiz_id: submission.quiz_id,
        completed_at: submission.completed_at,
        score: submission.score,
        max_score: submission.max_score,
        quiz_title: quiz.title,
        quiz_description: quiz.description,
        quiz_type: quiz.quiz_type || "scored",
        vibe_analysis: vibe?.vibe_analysis,
        vibe_categories: vibe?.vibe_categories
      };
    });
    
    console.log(`[Quiz Get Attempts API] Returning ${combinedAttempts.length} attempts`);
    
    return NextResponse.json({
      success: true,
      attempts: combinedAttempts
    });
    
  } catch (error) {
    console.error('[Quiz Get Attempts API] Unexpected error:', error);
    return NextResponse.json(
      { error: "Failed to get attempts", details: String(error) },
      { status: 500 }
    );
  }
} 