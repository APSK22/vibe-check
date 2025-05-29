import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  console.log('[Quiz Fetch API] Received request to fetch quiz');
  
  try {
    // Check authentication
    const { userId } = getAuth(req);
    console.log('[Quiz Fetch API] User ID:', userId || 'not authenticated');
    
    // Get request data
    const { quizId } = await req.json();
    
    if (!quizId) {
      console.log('[Quiz Fetch API] Missing quiz ID');
      return NextResponse.json(
        { error: "Missing quiz ID" },
        { status: 400 }
      );
    }
    
    console.log('[Quiz Fetch API] Fetching quiz:', quizId, 'for user:', userId || 'anonymous');
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Fetch the quiz by ID - for both authenticated and unauthenticated users
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();
    
    // Log more details about the quiz fetch result
    if (quizData) {
      console.log(`[Quiz Fetch API] Quiz found, title: "${quizData.title}", public: ${quizData.is_public}, creator: ${quizData.created_by}`);
    } else {
      console.log('[Quiz Fetch API] Quiz not found, error:', quizError?.message);
    }
    
    if (quizError) {
      console.error('[Quiz Fetch API] Error fetching quiz:', JSON.stringify(quizError));
      
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
    
    // If we get here, the quiz exists and can be accessed by anyone with the direct link
    console.log('[Quiz Fetch API] Quiz found:', quizData.title);
    
    // Fetch questions
    const { data: questionsData, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order_num');
    
    if (questionsError) {
      console.error('[Quiz Fetch API] Error fetching questions:', questionsError);
      return NextResponse.json(
        { error: "Failed to fetch questions", details: questionsError },
        { status: 500 }
      );
    }
    
    console.log(`[Quiz Fetch API] Found ${questionsData.length} questions`);
    
    if (questionsData.length === 0) {
      console.warn('[Quiz Fetch API] No questions found for this quiz');
    }
    
    // Get submission count
    const { count: submissionCount, error: submissionError } = await supabase
      .from('quiz_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', quizId);
      
    if (submissionError) {
      console.error('[Quiz Fetch API] Error counting submissions:', submissionError);
      // Continue anyway - non-critical data
    }
    
    console.log(`[Quiz Fetch API] Found ${submissionCount || 0} submissions for this quiz`);
    
    // Fetch options for each question
    const questionsWithOptions = await Promise.all(
      questionsData.map(async (q) => {
        const { data: optionsData, error: optionsError } = await supabase
          .from('options')
          .select('*')
          .eq('question_id', q.id)
          .order('order_num');
        
        if (optionsError) {
          console.error('[Quiz Fetch API] Error fetching options for question', q.id, ':', optionsError);
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
    
    console.log('[Quiz Fetch API] Successfully prepared quiz data');
    
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
    console.error('[Quiz Fetch API] Unexpected error:', error);
    return NextResponse.json(
      { error: "Failed to fetch quiz", details: String(error) },
      { status: 500 }
    );
  }
} 