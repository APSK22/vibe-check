import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  console.log('[Quiz Get Attempt Answers API] Received request to get attempt answers');
  
  try {
    // Check authentication
    const { userId } = getAuth(req);
    console.log('[Quiz Get Attempt Answers API] User ID:', userId || 'not authenticated');
    
    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to view answers" },
        { status: 401 }
      );
    }
    
    // Get request data
    const { attemptId, quizId } = await req.json();
    
    if (!attemptId || !quizId) {
      console.log('[Quiz Get Attempt Answers API] Missing required fields');
      return NextResponse.json(
        { error: "Missing attempt ID or quiz ID" },
        { status: 400 }
      );
    }
    
    // Verify that this submission belongs to the user
    const supabase = await createAdminClient();
    
    // Check if the submission belongs to the user
    const { data: submission, error: submissionError } = await supabase
      .from('quiz_submissions')
      .select('id')
      .eq('id', attemptId)
      .eq('user_id', userId)
      .single();
      
    if (submissionError) {
      console.error('[Quiz Get Attempt Answers API] Error verifying submission:', submissionError);
      return NextResponse.json(
        { error: "Not authorized to view this attempt" },
        { status: 403 }
      );
    }
    
    // Fetch the questions for this quiz
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, question, order_num')
      .eq('quiz_id', quizId)
      .order('order_num');
      
    if (questionsError) {
      console.error('[Quiz Get Attempt Answers API] Error fetching questions:', questionsError);
      return NextResponse.json(
        { error: "Failed to fetch questions" },
        { status: 500 }
      );
    }
    
    console.log(`[Quiz Get Attempt Answers API] Found ${questions?.length || 0} questions`);
    
    // Fetch user answers
    const { data: userAnswersData, error: answersError } = await supabase
      .from('user_answers')
      .select(`
        question_id,
        selected_option_id,
        is_correct,
        options:options!selected_option_id(option_text)
      `)
      .eq('submission_id', attemptId);
      
    if (answersError) {
      console.error('[Quiz Get Attempt Answers API] Error fetching user answers:', answersError);
      return NextResponse.json(
        { error: "Failed to fetch answers" },
        { status: 500 }
      );
    }
    
    console.log(`[Quiz Get Attempt Answers API] Found ${userAnswersData?.length || 0} answers`);
    
    // Map question IDs to questions
    const questionMap = new Map();
    questions?.forEach(q => questionMap.set(q.id, q));
    
    // Format user answers
    const formattedAnswers = userAnswersData?.map(answer => ({
      question: questionMap.get(answer.question_id)?.question || "Unknown Question",
      selected_option: answer.options?.[0]?.option_text || "Unknown Option",
      is_correct: answer.is_correct
    })) || [];
    
    return NextResponse.json({
      success: true,
      answers: formattedAnswers
    });
    
  } catch (error) {
    console.error('[Quiz Get Attempt Answers API] Unexpected error:', error);
    return NextResponse.json(
      { error: "Failed to get answers", details: String(error) },
      { status: 500 }
    );
  }
} 