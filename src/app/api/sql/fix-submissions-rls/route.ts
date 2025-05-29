import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  console.log('[Fix Submissions RLS] Received request to fix submission RLS policies');
  
  try {
    // Check authentication
    const { userId } = getAuth(req);
    console.log('[Fix Submissions RLS] User ID:', userId || 'not authenticated');
    
    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to fix database policies" },
        { status: 401 }
      );
    }
    
    // Create Supabase client
    const supabase = await createClient();
    
    // 1. Create exec_sql function if it doesn't exist
    try {
      const { error: sqlError } = await supabase.rpc('exec_sql', {
        sql_query: `
          CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
          RETURNS json
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            EXECUTE sql_query;
            RETURN json_build_object('success', true);
          EXCEPTION WHEN OTHERS THEN
            RETURN json_build_object(
              'success', false,
              'error', SQLERRM
            );
          END;
          $$;
        `
      });
      
      if (sqlError && !sqlError.message.includes('already exists')) {
        console.error('[Fix Submissions RLS] Error creating exec_sql function:', sqlError);
      }
    } catch (error) {
      console.log('[Fix Submissions RLS] Function may already exist');
    }
    
    // 2. Drop existing quiz submissions policies
    const dropResults = [];
    
    try {
      const { data: dropData1, error: dropError1 } = await supabase.rpc('exec_sql', {
        sql_query: `DROP POLICY IF EXISTS "Users can see their own submissions" ON quiz_submissions;`
      });
      dropResults.push({ operation: 'drop_own_submissions_policy', success: !dropError1, error: dropError1 });
      
      const { data: dropData2, error: dropError2 } = await supabase.rpc('exec_sql', {
        sql_query: `DROP POLICY IF EXISTS "Users can see submissions for their quizzes" ON quiz_submissions;`
      });
      dropResults.push({ operation: 'drop_quiz_owner_policy', success: !dropError2, error: dropError2 });
      
      const { data: dropData3, error: dropError3 } = await supabase.rpc('exec_sql', {
        sql_query: `DROP POLICY IF EXISTS "Quiz creators can see submissions for their quizzes" ON quiz_submissions;`
      });
      dropResults.push({ operation: 'drop_alt_quiz_owner_policy', success: !dropError3, error: dropError3 });
      
      const { data: dropData4, error: dropError4 } = await supabase.rpc('exec_sql', {
        sql_query: `DROP POLICY IF EXISTS "Users can submit any quiz" ON quiz_submissions;`
      });
      dropResults.push({ operation: 'drop_submit_policy', success: !dropError4, error: dropError4 });
      
      const { data: dropData5, error: dropError5 } = await supabase.rpc('exec_sql', {
        sql_query: `DROP POLICY IF EXISTS "Users can insert their own submissions" ON quiz_submissions;`
      });
      dropResults.push({ operation: 'drop_insert_policy', success: !dropError5, error: dropError5 });
    } catch (error) {
      console.error('[Fix Submissions RLS] Error dropping policies:', error);
    }
    
    // 3. Create new optimized policies
    const createResults = [];
    
    try {
      // Allow users to see their own submissions
      const { data: createData1, error: createError1 } = await supabase.rpc('exec_sql', {
        sql_query: `
          CREATE POLICY "Users can see their own submissions" ON quiz_submissions
          FOR SELECT USING (user_id = auth.jwt()->>'sub');
        `
      });
      createResults.push({ operation: 'create_own_submissions_policy', success: !createError1, error: createError1 });
      
      // Allow quiz owners to see all submissions for their quizzes
      const { data: createData2, error: createError2 } = await supabase.rpc('exec_sql', {
        sql_query: `
          CREATE POLICY "Quiz owners can see all submissions" ON quiz_submissions
          FOR SELECT USING (
            quiz_id IN (
              SELECT id FROM quizzes WHERE created_by = auth.jwt()->>'sub'
            )
          );
        `
      });
      createResults.push({ operation: 'create_quiz_owner_policy', success: !createError2, error: createError2 });
      
      // Allow any authenticated user to submit any quiz
      const { data: createData3, error: createError3 } = await supabase.rpc('exec_sql', {
        sql_query: `
          CREATE POLICY "Users can submit any quiz" ON quiz_submissions
          FOR INSERT WITH CHECK (user_id = auth.jwt()->>'sub');
        `
      });
      createResults.push({ operation: 'create_submit_policy', success: !createError3, error: createError3 });
      
      // Create count function with security definer
      const { data: createData4, error: createError4 } = await supabase.rpc('exec_sql', {
        sql_query: `
          CREATE OR REPLACE FUNCTION count_quiz_submissions(quiz_id_param UUID)
          RETURNS integer
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
            submission_count integer;
          BEGIN
            SELECT COUNT(*) INTO submission_count
            FROM quiz_submissions
            WHERE quiz_id = quiz_id_param;
            
            RETURN submission_count;
          END;
          $$;
        `
      });
      createResults.push({ operation: 'create_count_function', success: !createError4, error: createError4 });
    } catch (error) {
      console.error('[Fix Submissions RLS] Error creating policies:', error);
    }
    
    return NextResponse.json({
      success: true,
      message: "Quiz submission policies have been fixed",
      drop_results: dropResults,
      create_results: createResults
    });
    
  } catch (error) {
    console.error('[Fix Submissions RLS] Unexpected error:', error);
    return NextResponse.json(
      { error: "Failed to fix submission policies", details: String(error) },
      { status: 500 }
    );
  }
}