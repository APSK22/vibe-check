import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  console.log('[Quiz Delete API] Received request to delete quiz');
  
  try {
    // Check authentication
    const { userId } = getAuth(req);
    console.log('[Quiz Delete API] User ID:', userId || 'not authenticated');
    
    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to delete a quiz" },
        { status: 401 }
      );
    }
    
    // Get request data
    const { quizId } = await req.json();
    
    if (!quizId) {
      console.log('[Quiz Delete API] Missing quiz ID');
      return NextResponse.json(
        { error: "Missing quiz ID" },
        { status: 400 }
      );
    }
    
    console.log(`[Quiz Delete API] Attempting to delete quiz: ${quizId}`);
    
    // Create Supabase client
    const supabase = await createClient();
    
    // First check if the user is the creator of the quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('created_by')
      .eq('id', quizId)
      .single();
      
    if (quizError) {
      console.error('[Quiz Delete API] Error fetching quiz:', quizError);
      return NextResponse.json(
        { error: "Failed to fetch quiz", details: quizError },
        { status: 404 }
      );
    }
    
    if (quiz.created_by !== userId) {
      console.error('[Quiz Delete API] User is not the creator of this quiz');
      return NextResponse.json(
        { error: "You do not have permission to delete this quiz" },
        { status: 403 }
      );
    }
    
    // Delete options first (cascade should handle this, but doing it explicitly for safety)
    console.log('[Quiz Delete API] Deleting options for all questions in the quiz');
    
    // First get the question IDs
    const { data: questionIds, error: questionsError } = await supabase
      .from('questions')
      .select('id')
      .eq('quiz_id', quizId);
      
    if (questionIds && questionIds.length > 0) {
      // Then delete the options for these questions
      await supabase
        .from('options')
        .delete()
        .in('question_id', questionIds.map(q => q.id));
    }
    
    // Delete questions
    console.log('[Quiz Delete API] Deleting questions for the quiz');
    await supabase
      .from('questions')
      .delete()
      .eq('quiz_id', quizId);
    
    // Delete quiz
    console.log('[Quiz Delete API] Deleting the quiz itself');
    const { error: deleteError } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', quizId);
    
    if (deleteError) {
      console.error('[Quiz Delete API] Error deleting quiz:', deleteError);
      return NextResponse.json(
        { error: "Failed to delete quiz", details: deleteError },
        { status: 500 }
      );
    }
    
    console.log(`[Quiz Delete API] Successfully deleted quiz: ${quizId}`);
    return NextResponse.json({
      success: true,
      message: "Quiz deleted successfully"
    });
    
  } catch (error) {
    console.error('[Quiz Delete API] Unexpected error:', error);
    return NextResponse.json(
      { error: "Failed to delete quiz", details: String(error) },
      { status: 500 }
    );
  }
} 