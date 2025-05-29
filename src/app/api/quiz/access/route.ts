import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  console.log('[Quiz Access API] Received request to access quiz by link');
  
  try {
    // Check authentication (optional)
    const { userId } = getAuth(req);
    console.log('[Quiz Access API] User ID:', userId || 'not authenticated');
    
    // Get request data
    const { quizId } = await req.json();
    
    if (!quizId) {
      console.log('[Quiz Access API] Missing quiz ID');
      return NextResponse.json(
        { error: "Missing quiz ID" },
        { status: 400 }
      );
    }
    
    console.log('[Quiz Access API] Accessing quiz:', quizId);
    
    // Create Supabase admin client to bypass RLS
    const supabase = await createAdminClient();
    
    // Fetch the quiz by ID using admin privileges
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();
    
    // Log more details about the quiz fetch result
    if (quizData) {
      console.log(`[Quiz Access API] Quiz found, title: "${quizData.title}", public: ${quizData.is_public}, creator: ${quizData.created_by}`);
    } else {
      console.log('[Quiz Access API] Quiz not found, error:', quizError?.message);
    }
    
    if (quizError) {
      console.error('[Quiz Access API] Error fetching quiz:', JSON.stringify(quizError));
      
      // Handle specific error codes
      if (quizError.code === 'PGRST116') {
        // This is a not found issue - the quiz doesn't exist in the database
        return NextResponse.json(
          { error: "Quiz not found. It may have been deleted." },
          { status: 404 }
        );
      } else {
        // Other database or unexpected errors
        return NextResponse.json(
          { error: "Failed to fetch quiz", details: quizError },
          { status: 500 }
        );
      }
    }
    
    // Fetch questions using admin privileges
    const { data: questionsData, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order_num');
    
    if (questionsError) {
      console.error('[Quiz Access API] Error fetching questions:', questionsError);
      return NextResponse.json(
        { error: "Failed to fetch questions", details: questionsError },
        { status: 500 }
      );
    }
    
    console.log(`[Quiz Access API] Found ${questionsData.length} questions`);
    
    // Get submission count
    const { count: submissionCount, error: submissionError } = await supabase
      .from('quiz_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', quizId);
      
    if (submissionError) {
      console.error('[Quiz Access API] Error counting submissions:', submissionError);
      // Continue anyway - non-critical data
    }
    
    // Fetch options for each question using admin privileges
    const questionsWithOptions = await Promise.all(
      questionsData.map(async (q) => {
        const { data: optionsData, error: optionsError } = await supabase
          .from('options')
          .select('*')
          .eq('question_id', q.id)
          .order('order_num');
        
        if (optionsError) {
          console.error('[Quiz Access API] Error fetching options for question', q.id, ':', optionsError);
          return {
            ...q,
            options: []
          };
        }
        
        return {
          ...q,
          options: optionsData
        };
      })
    );
    
    console.log('[Quiz Access API] Successfully prepared quiz data');
    
    // Return the complete quiz data
    return NextResponse.json({
      success: true,
      quiz: {
        ...quizData,
        questions: questionsWithOptions,
        submission_count: submissionCount || 0
      }
    });
    
  } catch (error) {
    console.error('[Quiz Access API] Unexpected error:', error);
    return NextResponse.json(
      { error: "Failed to access quiz", details: String(error) },
      { status: 500 }
    );
  }
} 