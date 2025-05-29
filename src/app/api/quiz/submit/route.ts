import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  console.log('[Quiz Submit API] Received request to submit quiz answers');
  
  try {
    // Check authentication
    const { userId } = getAuth(req);
    console.log('[Quiz Submit API] User ID:', userId || 'not authenticated');
    
    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to submit a quiz" },
        { status: 401 }
      );
    }
    
    // Get request data
    const { quizId, userId: submittedUserId, score, maxScore, answers } = await req.json();
    
    if (!quizId || !submittedUserId || typeof score !== 'number' || !maxScore || !answers) {
      console.log('[Quiz Submit API] Missing required fields');
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Verify that the submitted userId matches the authenticated userId
    if (submittedUserId !== userId) {
      console.error('[Quiz Submit API] User ID mismatch');
      return NextResponse.json(
        { error: "User ID mismatch" },
        { status: 403 }
      );
    }
    
    console.log(`[Quiz Submit API] Submitting quiz ${quizId} for user ${userId}`);
    
    // Create Supabase admin client to bypass RLS
    const supabase = await createAdminClient();
    
    // Get quiz data to verify it exists and check options
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .select(`
        id, 
        quiz_type,
        questions!inner (
          id,
          options (
            id,
            is_correct
          )
        )
      `)
      .eq('id', quizId)
      .single();
    
    if (quizError) {
      console.error('[Quiz Submit API] Error fetching quiz:', quizError);
      return NextResponse.json(
        { error: "Failed to fetch quiz details" },
        { status: 500 }
      );
    }
    
    // Create the submission record
    const { data: submission, error: submissionError } = await supabase
      .from('quiz_submissions')
      .insert({
        quiz_id: quizId,
        user_id: userId,
        score,
        max_score: maxScore
      })
      .select()
      .single();
      
    if (submissionError) {
      console.error('[Quiz Submit API] Error creating submission:', submissionError);
      return NextResponse.json(
        { error: "Failed to create submission record" },
        { status: 500 }
      );
    }
    
    console.log(`[Quiz Submit API] Created submission record: ${submission.id}`);
    
    // Insert user answers
    let answersInserted = 0;
    
    for (const [questionId, optionId] of Object.entries(answers)) {
      // Find the question in the quiz data
      const question = quizData.questions.find(q => q.id === questionId);
      
      if (!question) {
        console.warn(`[Quiz Submit API] Question ${questionId} not found in quiz`);
        continue;
      }
      
      // Find the selected option
      const option = question.options.find(o => o.id === optionId);
      
      if (!option) {
        console.warn(`[Quiz Submit API] Option ${optionId} not found in question ${questionId}`);
        continue;
      }
      
      // Insert the user's answer
      const { error: answerError } = await supabase
        .from('user_answers')
        .insert({
          submission_id: submission.id,
          question_id: questionId,
          selected_option_id: optionId,
          is_correct: option.is_correct || false
        });
        
      if (answerError) {
        console.error(`[Quiz Submit API] Error inserting answer for question ${questionId}:`, answerError);
      } else {
        answersInserted++;
      }
    }
    
    console.log(`[Quiz Submit API] Inserted ${answersInserted} answers for submission ${submission.id}`);
    
    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      answersInserted
    });
    
  } catch (error) {
    console.error('[Quiz Submit API] Unexpected error:', error);
    return NextResponse.json(
      { error: "Failed to submit quiz", details: String(error) },
      { status: 500 }
    );
  }
} 