import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  console.log('[Manual Quiz API] Received request to create quiz');
  
  try {
    // Check authentication
    console.log('[Manual Quiz API] Checking authentication with Clerk');
    const { userId } = getAuth(req);
    
    if (userId) {
      console.log('[Manual Quiz API] User authenticated:', userId);
    } else {
      console.log('[Manual Quiz API] No authenticated user found');
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get request data
    const requestData = await req.json();
    console.log('[Manual Quiz API] Request data:', requestData);
    const { title, description, visibility } = requestData;
    
    // Validate inputs
    if (!title) {
      console.log('[Manual Quiz API] Missing required fields');
      return NextResponse.json(
        { error: "Quiz title is required" },
        { status: 400 }
      );
    }
    
    // Create a supabase client
    console.log('[Manual Quiz API] Creating Supabase client');
    const supabase = await createClient();
    
    // Insert quiz into database
    console.log('[Manual Quiz API] Inserting quiz into database');
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .insert({
        title,
        description: description || `A quiz about ${title}`,
        is_public: visibility === "public",
        created_by: userId,
      })
      .select()
      .single();
    
    if (quizError) {
      console.error('[Manual Quiz API] Error creating quiz:', quizError);
      return NextResponse.json(
        { error: "Failed to create quiz", details: quizError },
        { status: 500 }
      );
    }
    
    console.log('[Manual Quiz API] Quiz created successfully:', quiz.id);
    return NextResponse.json({
      success: true,
      quizId: quiz.id,
      message: "Quiz created successfully"
    });
  } catch (error) {
    console.error('[Manual Quiz API] Error in quiz creation:', error);
    return NextResponse.json(
      { error: "Failed to create quiz", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 