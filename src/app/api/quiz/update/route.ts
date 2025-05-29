import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  console.log('[Quiz Update API] Received request to update quiz');
  
  try {
    // Check authentication
    const { userId } = getAuth(req);
    console.log('[Quiz Update API] User ID:', userId || 'not authenticated');
    
    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to update a quiz" },
        { status: 401 }
      );
    }
    
    // Get request data
    const { quizId, questions } = await req.json();
    
    if (!quizId) {
      console.log('[Quiz Update API] Missing quiz ID');
      return NextResponse.json(
        { error: "Missing quiz ID" },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(questions)) {
      console.log('[Quiz Update API] Missing or invalid questions data');
      return NextResponse.json(
        { error: "Missing or invalid questions data" },
        { status: 400 }
      );
    }
    
    console.log(`[Quiz Update API] Updating quiz: ${quizId} with ${questions.length} questions`);
    
    // Create Supabase client
    const supabase = await createClient();
    
    // First check if the user is the creator of the quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('created_by')
      .eq('id', quizId)
      .single();
      
    if (quizError) {
      console.error('[Quiz Update API] Error fetching quiz:', quizError);
      return NextResponse.json(
        { error: "Failed to fetch quiz", details: quizError },
        { status: 404 }
      );
    }
    
    if (quiz.created_by !== userId) {
      console.error('[Quiz Update API] User is not the creator of this quiz');
      return NextResponse.json(
        { error: "You do not have permission to update this quiz" },
        { status: 403 }
      );
    }
    
    // Process and save each question and its options
    console.log('[Quiz Update API] Processing questions and options');
    
    for (const question of questions) {
      let questionId = question.id;
      
      // If it's a new question, insert it
      if (question.isNew) {
        console.log('[Quiz Update API] Inserting new question:', question.question.substring(0, 30));
        
        const { data: newQuestion, error: questionError } = await supabase
          .from('questions')
          .insert({
            quiz_id: quizId,
            question: question.question,
            order_num: question.order_num
          })
          .select()
          .single();
          
        if (questionError) {
          console.error('[Quiz Update API] Error saving question:', questionError);
          return NextResponse.json(
            { error: "Failed to save question", details: questionError },
            { status: 500 }
          );
        }
        
        questionId = newQuestion.id;
      } else {
        // Update existing question
        console.log('[Quiz Update API] Updating existing question:', question.id);
        
        const { error: updateError } = await supabase
          .from('questions')
          .update({
            question: question.question,
            order_num: question.order_num
          })
          .eq('id', question.id);
          
        if (updateError) {
          console.error('[Quiz Update API] Error updating question:', updateError);
          return NextResponse.json(
            { error: "Failed to update question", details: updateError },
            { status: 500 }
          );
        }
      }
      
      // Save options
      for (const option of question.options) {
        if (option.isNew) {
          // Insert new option
          console.log('[Quiz Update API] Inserting new option for question:', questionId);
          
          const { error: optionError } = await supabase
            .from('options')
            .insert({
              question_id: questionId,
              option_text: option.option_text,
              is_correct: option.is_correct,
              order_num: option.order_num
            });
            
          if (optionError) {
            console.error('[Quiz Update API] Error saving option:', optionError);
            return NextResponse.json(
              { error: "Failed to save option", details: optionError },
              { status: 500 }
            );
          }
        } else {
          // Update existing option
          console.log('[Quiz Update API] Updating existing option:', option.id);
          
          const { error: updateOptionError } = await supabase
            .from('options')
            .update({
              option_text: option.option_text,
              is_correct: option.is_correct,
              order_num: option.order_num
            })
            .eq('id', option.id);
            
          if (updateOptionError) {
            console.error('[Quiz Update API] Error updating option:', updateOptionError);
            return NextResponse.json(
              { error: "Failed to update option", details: updateOptionError },
              { status: 500 }
            );
          }
        }
      }
    }
    
    console.log(`[Quiz Update API] Successfully updated quiz: ${quizId}`);
    return NextResponse.json({
      success: true,
      message: "Quiz updated successfully"
    });
    
  } catch (error) {
    console.error('[Quiz Update API] Unexpected error:', error);
    return NextResponse.json(
      { error: "Failed to update quiz", details: String(error) },
      { status: 500 }
    );
  }
} 