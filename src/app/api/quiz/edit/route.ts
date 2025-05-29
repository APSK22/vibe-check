import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  console.log('[Quiz Edit API] Received request to fetch quiz for editing');
  
  try {
    // Check authentication
    const { userId } = getAuth(req);
    console.log('[Quiz Edit API] User ID:', userId || 'not authenticated');
    
    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to edit a quiz" },
        { status: 401 }
      );
    }
    
    // Get request data
    const { quizId } = await req.json();
    
    if (!quizId) {
      console.log('[Quiz Edit API] Missing quiz ID');
      return NextResponse.json(
        { error: "Missing quiz ID" },
        { status: 400 }
      );
    }
    
    console.log(`[Quiz Edit API] Fetching quiz: ${quizId}`);
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Fetch quiz details - user must be the creator
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .eq('created_by', userId)
      .single();
      
    if (quizError) {
      console.error('[Quiz Edit API] Error fetching quiz:', quizError);
      
      if (quizError.code === 'PGRST116') {
        return NextResponse.json(
          { error: "Quiz not found or you don't have permission to edit it" },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: "Failed to fetch quiz", details: quizError },
        { status: 500 }
      );
    }
    
    console.log('[Quiz Edit API] Quiz found, fetching questions');
    
    // Fetch questions
    const { data: questionsData, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order_num');
      
    if (questionsError) {
      console.error('[Quiz Edit API] Error fetching questions:', questionsError);
      return NextResponse.json(
        { error: "Failed to fetch questions", details: questionsError },
        { status: 500 }
      );
    }
    
    console.log(`[Quiz Edit API] Found ${questionsData.length} questions, fetching options`);
    
    // Fetch options for each question
    const questionsWithOptions = await Promise.all(
      questionsData.map(async (q) => {
        const { data: optionsData, error: optionsError } = await supabase
          .from('options')
          .select('*')
          .eq('question_id', q.id)
          .order('order_num');
          
        if (optionsError) {
          console.error('[Quiz Edit API] Error fetching options for question', q.id, ':', optionsError);
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
    
    console.log('[Quiz Edit API] Successfully prepared quiz data for editing');
    
    return NextResponse.json({
      success: true,
      quiz: quizData,
      questions: questionsWithOptions
    });
    
  } catch (error) {
    console.error('[Quiz Edit API] Unexpected error:', error);
    return NextResponse.json(
      { error: "Failed to fetch quiz", details: String(error) },
      { status: 500 }
    );
  }
} 