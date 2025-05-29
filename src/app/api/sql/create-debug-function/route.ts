import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  console.log('[SQL Debug Function] Received request to create debug function');
  
  try {
    // Check authentication
    const { userId } = getAuth(req);
    console.log('[SQL Debug Function] User ID:', userId || 'not authenticated');
    
    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to create database functions" },
        { status: 401 }
      );
    }
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Create the debug policy function
    const { error: funcError } = await supabase.rpc('create_debug_policy_function');
    
    if (funcError) {
      // Try creating the function manually
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql_query: `
          CREATE OR REPLACE FUNCTION debug_get_policies(table_name text)
          RETURNS TABLE (
            policyname text,
            tablename text,
            action text,
            roles text,
            cmd text,
            qual text,
            with_check text
          )
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            RETURN QUERY
            SELECT
              p.policyname::text,
              p.tablename::text,
              p.action::text,
              p.roles::text,
              p.cmd::text,
              p.qual::text,
              p.with_check::text
            FROM
              pg_policy p
              JOIN pg_class c ON p.tablename = c.relname
              JOIN pg_namespace n ON c.relnamespace = n.oid
            WHERE
              n.nspname = 'public'
              AND p.tablename = table_name;
          END;
          $$;
        `
      });
      
      if (createError) {
        console.error('[SQL Debug Function] Error creating function:', createError);
        return NextResponse.json(
          { error: "Failed to create debug function", details: createError },
          { status: 500 }
        );
      }
    }
    
    // Create the exec_sql function if needed
    const { error: execSqlError } = await supabase.rpc('exec_sql', {
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
    
    if (execSqlError && !execSqlError.message.includes('already exists')) {
      console.error('[SQL Debug Function] Error creating exec_sql function:', execSqlError);
    }
    
    return NextResponse.json({
      success: true,
      message: "Debug functions created successfully"
    });
    
  } catch (error) {
    console.error('[SQL Debug Function] Unexpected error:', error);
    return NextResponse.json(
      { error: "Failed to create debug function", details: String(error) },
      { status: 500 }
    );
  }
} 