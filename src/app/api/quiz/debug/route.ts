import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  console.log('[Quiz Debug API] Received request to debug quiz access');
  
  try {
    // Check authentication (optional but logged)
    const { userId } = getAuth(req);
    console.log('[Quiz Debug API] User ID:', userId || 'not authenticated');
    
    // Get request data
    const { quizId } = await req.json();
    
    if (!quizId) {
      console.log('[Quiz Debug API] Missing quiz ID');
      return NextResponse.json(
        { error: "Missing quiz ID" },
        { status: 400 }
      );
    }
    
    // Initialize diagnostics object
    const diagnostics: Record<string, any> = {
      quizId,
      userId: userId || 'anonymous',
      timestamp: new Date().toISOString(),
    };
    
    // PART 1: Try with regular client (subject to RLS)
    console.log('[Quiz Debug API] Attempting quiz fetch with regular client');
    const regularClient = await createClient();
    
    // Check if quiz exists
    const { data: regularQuizData, error: regularQuizError } = await regularClient
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();
      
    diagnostics.regularClient = {
      quizData: regularQuizData ? {
        id: regularQuizData.id,
        title: regularQuizData.title,
        isPublic: regularQuizData.is_public,
        createdBy: regularQuizData.created_by,
        hasQuizData: !!regularQuizData
      } : null,
      quizError: regularQuizError ? {
        message: regularQuizError.message,
        code: regularQuizError.code
      } : null,
      canAccessQuiz: !regularQuizError
    };
    
    // Check if questions are accessible
    if (!regularQuizError) {
      const { data: regularQuestionsData, error: regularQuestionsError } = await regularClient
        .from('questions')
        .select('id')
        .eq('quiz_id', quizId)
        .limit(1);
        
      diagnostics.regularClient.canAccessQuestions = !regularQuestionsError;
      diagnostics.regularClient.questionsError = regularQuestionsError ? {
        message: regularQuestionsError.message,
        code: regularQuestionsError.code
      } : null;
    }
    
    // PART 2: Try with admin client (bypass RLS)
    console.log('[Quiz Debug API] Attempting quiz fetch with admin client');
    const adminClient = await createAdminClient();
    
    // Check if quiz exists in DB at all (bypassing RLS)
    const { data: adminQuizData, error: adminQuizError } = await adminClient
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();
      
    diagnostics.adminClient = {
      quizExists: !!adminQuizData,
      quizData: adminQuizData ? {
        id: adminQuizData.id,
        title: adminQuizData.title,
        isPublic: adminQuizData.is_public,
        createdBy: adminQuizData.created_by,
        createdAt: adminQuizData.created_at
      } : null,
      quizError: adminQuizError ? {
        message: adminQuizError.message,
        code: adminQuizError.code
      } : null,
    };
    
    // Get question count if quiz exists
    if (adminQuizData) {
      const { count: questionCount, error: countError } = await adminClient
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', quizId);
        
      diagnostics.adminClient.questionCount = questionCount || 0;
      diagnostics.adminClient.hasQuestions = questionCount && questionCount > 0;
    }
    
    // PART 3: Analyze RLS and permission issues
    if (adminQuizData) {
      diagnostics.analysis = {
        quizExists: true,
        isPublic: adminQuizData.is_public,
        isCreator: userId === adminQuizData.created_by,
        shouldHaveAccess: adminQuizData.is_public || userId === adminQuizData.created_by,
        actualAccess: !regularQuizError,
        possibleIssue: !regularQuizError ? null : (
          adminQuizData.is_public ? 
            "Quiz is public but RLS is blocking access" : 
            "Quiz is private and you're not the creator"
        )
      };
    } else {
      diagnostics.analysis = {
        quizExists: false,
        possibleIssue: "Quiz does not exist in the database"
      };
    }
    
    return NextResponse.json({
      success: true,
      diagnostics
    });
    
  } catch (error) {
    console.error('[Quiz Debug API] Error:', error);
    return NextResponse.json(
      { error: "Diagnostic failed", details: String(error) },
      { status: 500 }
    );
  }
} 