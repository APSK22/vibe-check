import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  console.log('[Quiz Delete Attempt API] Received request to delete attempt');
  
  try {
    // Check authentication
    const { userId } = getAuth(req);
    console.log('[Quiz Delete Attempt API] User ID:', userId || 'not authenticated');
    
    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to delete your attempts" },
        { status: 401 }
      );
    }
    
    // Get request data
    const { attemptId } = await req.json();
    
    if (!attemptId) {
      console.log('[Quiz Delete Attempt API] Missing attempt ID');
      return NextResponse.json(
        { error: "Missing attempt ID" },
        { status: 400 }
      );
    }
    
    // Create Supabase admin client to bypass RLS
    const supabase = await createAdminClient();
    
    // First verify the attempt belongs to this user
    const { data: submission, error: submissionError } = await supabase
      .from('quiz_submissions')
      .select('id')
      .eq('id', attemptId)
      .eq('user_id', userId)
      .single();
      
    if (submissionError) {
      console.error('[Quiz Delete Attempt API] Error verifying attempt ownership:', submissionError);
      return NextResponse.json(
        { error: "Not authorized to delete this attempt" },
        { status: 403 }
      );
    }
    
    // First delete related vibe_results if they exist
    const { error: vibeDeleteError } = await supabase
      .from('vibe_results')
      .delete()
      .eq('submission_id', attemptId);
      
    if (vibeDeleteError) {
      console.error('[Quiz Delete Attempt API] Error deleting vibe results:', vibeDeleteError);
      // Continue anyway, not critical
    }
    
    // Delete related user_answers
    const { error: answersDeleteError } = await supabase
      .from('user_answers')
      .delete()
      .eq('submission_id', attemptId);
      
    if (answersDeleteError) {
      console.error('[Quiz Delete Attempt API] Error deleting user answers:', answersDeleteError);
      // Continue anyway
    }
    
    // Then delete the submission
    const { error: submissionDeleteError } = await supabase
      .from('quiz_submissions')
      .delete()
      .eq('id', attemptId);
      
    if (submissionDeleteError) {
      console.error('[Quiz Delete Attempt API] Error deleting submission:', submissionDeleteError);
      return NextResponse.json(
        { error: "Failed to delete attempt" },
        { status: 500 }
      );
    }
    
    console.log(`[Quiz Delete Attempt API] Successfully deleted attempt ${attemptId}`);
    
    return NextResponse.json({
      success: true,
      message: "Attempt deleted successfully"
    });
    
  } catch (error) {
    console.error('[Quiz Delete Attempt API] Unexpected error:', error);
    return NextResponse.json(
      { error: "Failed to delete attempt", details: String(error) },
      { status: 500 }
    );
  }
} 