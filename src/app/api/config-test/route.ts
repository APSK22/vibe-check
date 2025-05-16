import { NextRequest, NextResponse } from "next/server";
import { testClerkConfig, testSupabaseConfig, testClerkSupabaseIntegration } from "@/lib/config-test";
import { createClient } from "@/lib/supabase-server";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    // Run basic configuration tests
    const clerkConfig = testClerkConfig();
    const supabaseConfig = await testSupabaseConfig();
    const integrationStatus = await testClerkSupabaseIntegration();
    
    // Test Clerk auth
    let clerkAuthStatus = "Not tested";
    try {
      const { userId } = getAuth(req);
      clerkAuthStatus = userId ? `Authenticated as ${userId}` : "Not authenticated";
      console.log('Clerk auth status:', clerkAuthStatus);
    } catch (error) {
      console.error('Error testing Clerk auth:', error);
      clerkAuthStatus = `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
    
    // Test Supabase client creation
    let supabaseConnectionStatus = "Not tested";
    try {
      const supabase = await createClient();
      const { error } = await supabase.from('quizzes').select('count').limit(1);
      
      if (error) {
        supabaseConnectionStatus = `Error: ${error.message}`;
      } else {
        supabaseConnectionStatus = "Connection successful";
      }
      console.log('Supabase connection status:', supabaseConnectionStatus);
    } catch (error) {
      console.error('Error testing Supabase connection:', error);
      supabaseConnectionStatus = `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      clerk: clerkConfig,
      supabase: supabaseConfig,
      integration: integrationStatus,
      clerkAuthStatus,
      supabaseConnectionStatus
    });
  } catch (error) {
    console.error('Error in config test API:', error);
    return NextResponse.json(
      { 
        error: "Failed to test configurations",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 