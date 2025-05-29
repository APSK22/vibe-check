import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase-server";
import { createClient as createServiceClient, SupabaseClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  console.log('[User Quizzes API] Received request to fetch user quizzes');
  
  try {
    // Check authentication
    const { userId } = getAuth(req);
    console.log('[User Quizzes API] User ID:', userId || 'not authenticated');
    
    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to access your quizzes" },
        { status: 401 }
      );
    }
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Fetch all quizzes created by the user
    const { data: quizzes, error: quizzesError } = await supabase
      .from('quizzes')
      .select('id, title, description, created_at, is_public, quiz_type')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });
      
    if (quizzesError) {
      console.error('[User Quizzes API] Error fetching quizzes:', quizzesError);
      return NextResponse.json(
        { error: "Failed to fetch your quizzes", details: quizzesError },
        { status: 500 }
      );
    }
    
    console.log(`[User Quizzes API] Found ${quizzes.length} quizzes`);
    
    // Create a service client to bypass RLS for direct counts
    let serviceClient: SupabaseClient | null = null;
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (supabaseUrl && supabaseServiceKey) {
        serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);
      }
    } catch (error) {
      console.error('[User Quizzes API] Error creating service client:', error);
    }
    
    // Get question count and submission count for each quiz
    const quizzesWithCounts = await Promise.all(
      quizzes.map(async (quiz) => {
        // Get question count
        const { count: questionCount, error: countError } = await supabase
          .from('questions')
          .select('id', { count: 'exact', head: true })
          .eq('quiz_id', quiz.id);
          
        if (countError) {
          console.error(`[User Quizzes API] Error counting questions for quiz ${quiz.id}:`, countError);
        }
        
        // Get submission count using service client if available
        let submissionCount = 0;
        try {
          if (serviceClient) {
            // Use service client to bypass RLS
            const { count, error } = await serviceClient
              .from('quiz_submissions')
              .select('*', { count: 'exact', head: true })
              .eq('quiz_id', quiz.id);
              
            if (!error) {
              submissionCount = count || 0;
            } else {
              console.error(`[User Quizzes API] Error counting submissions with service client:`, error);
            }
          } else {
            // Fallback to regular client
            const { count, error } = await supabase
              .from('quiz_submissions')
              .select('*', { count: 'exact', head: true })
              .eq('quiz_id', quiz.id);
              
            if (!error) {
              submissionCount = count || 0;
            }
          }
        } catch (submissionError) {
          console.error(`[User Quizzes API] Error counting submissions:`, submissionError);
        }
        
        console.log(`[User Quizzes API] Quiz ${quiz.id} has ${submissionCount} submissions`);
        
        return {
          ...quiz,
          questionCount: questionCount || 0,
          submissionCount: submissionCount
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      quizzes: quizzesWithCounts
    });
    
  } catch (error) {
    console.error('[User Quizzes API] Unexpected error:', error);
    return NextResponse.json(
      { error: "Failed to fetch quizzes", details: String(error) },
      { status: 500 }
    );
  }
} 