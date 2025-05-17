import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST() {
  try {
    const supabase = await createClient();
    
    // Add migration statements here - these should match your migration-update-fix.sql
    const migrations = [
      // Check for and create vibe_results table if it doesn't exist
      `
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'vibe_results') THEN
                CREATE TABLE vibe_results (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    submission_id UUID NOT NULL,
                    quiz_id UUID NOT NULL,
                    user_id TEXT NOT NULL,
                    vibe_analysis TEXT NOT NULL,
                    vibe_categories JSONB,
                    analyzed_by TEXT NOT NULL DEFAULT 'ai',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );

                -- Add foreign keys
                ALTER TABLE vibe_results 
                    ADD CONSTRAINT fk_submission_id 
                    FOREIGN KEY (submission_id) 
                    REFERENCES quiz_submissions(id) 
                    ON DELETE CASCADE;
                
                ALTER TABLE vibe_results 
                    ADD CONSTRAINT fk_quiz_id 
                    FOREIGN KEY (quiz_id) 
                    REFERENCES quizzes(id) 
                    ON DELETE CASCADE;

                -- Enable RLS
                ALTER TABLE vibe_results ENABLE ROW LEVEL SECURITY;

                -- Add RLS policies
                CREATE POLICY "Users can see their own vibe results" ON vibe_results
                    FOR SELECT USING (user_id = auth.jwt()->>'sub');

                CREATE POLICY "Users can see vibe results for quizzes they created" ON vibe_results
                    FOR SELECT USING (
                        quiz_id IN (SELECT id FROM quizzes WHERE created_by = auth.jwt()->>'sub')
                    );

                CREATE POLICY "Users can insert their own vibe results" ON vibe_results
                    FOR INSERT WITH CHECK (user_id = auth.jwt()->>'sub');
            END IF;
        END $$;
      `,
      
      // Make sure quiz_type exists in quizzes table
      `
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'quizzes' AND column_name = 'quiz_type'
            ) THEN
                ALTER TABLE quizzes ADD COLUMN quiz_type TEXT NOT NULL DEFAULT 'scored' 
                CHECK (quiz_type IN ('scored', 'vibe'));
            END IF;
            
            -- Make sure is_correct is nullable in options table
            ALTER TABLE options ALTER COLUMN is_correct DROP NOT NULL;
        END $$;
      `
    ];

    // Run each migration statement
    const results = [];
    for (const migration of migrations) {
      const { error } = await supabase.rpc('exec', { sql: migration });
      
      if (error) {
        console.error("Migration error:", error);
        results.push({ success: false, error: error.message });
      } else {
        results.push({ success: true });
      }
    }
    
    // Check table structure in the end
    const tableChecks = await Promise.all([
      supabase.from('vibe_results').select('*', { count: 'exact', head: true }),
      supabase.from('quiz_submissions').select('*', { count: 'exact', head: true }),
      supabase.from('quizzes').select('*', { count: 'exact', head: true })
    ]);
    
    return NextResponse.json({
      success: true,
      migrations: results,
      tables: {
        vibe_results: { exists: !tableChecks[0].error, count: tableChecks[0].count },
        quiz_submissions: { exists: !tableChecks[1].error, count: tableChecks[1].count },
        quizzes: { exists: !tableChecks[2].error, count: tableChecks[2].count }
      }
    });
  } catch (error) {
    console.error("Error running migrations:", error);
    return NextResponse.json({ error: "Failed to run migrations" }, { status: 500 });
  }
} 