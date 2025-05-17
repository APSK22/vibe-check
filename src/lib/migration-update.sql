-- Add quiz_type column to quizzes table
ALTER TABLE quizzes ADD COLUMN quiz_type TEXT NOT NULL DEFAULT 'scored' CHECK (quiz_type IN ('scored', 'vibe'));

-- Create option_interpretations table for vibe analysis
CREATE TABLE option_interpretations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    option_id UUID REFERENCES options(id) ON DELETE CASCADE,
    vibe_category TEXT NOT NULL,
    vibe_value TEXT NOT NULL,
    weight INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create vibe_results table to store AI-generated vibe analysis
CREATE TABLE vibe_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES quiz_submissions(id) ON DELETE CASCADE,
    vibe_analysis TEXT NOT NULL,
    vibe_categories JSONB,
    analyzed_by TEXT NOT NULL DEFAULT 'ai',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on new tables
ALTER TABLE option_interpretations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for option_interpretations
CREATE POLICY "Users can see option interpretations for public quizzes" ON option_interpretations
    FOR SELECT USING (
        option_id IN (
            SELECT id FROM options WHERE question_id IN (
                SELECT id FROM questions WHERE quiz_id IN (
                    SELECT id FROM quizzes WHERE is_public = true
                )
            )
        )
    );

CREATE POLICY "Users can see option interpretations for their own quizzes" ON option_interpretations
    FOR SELECT USING (
        option_id IN (
            SELECT id FROM options WHERE question_id IN (
                SELECT id FROM questions WHERE quiz_id IN (
                    SELECT id FROM quizzes WHERE created_by = auth.jwt()->>'sub'
                )
            )
        )
    );

CREATE POLICY "Users can insert option interpretations for their own quizzes" ON option_interpretations
    FOR INSERT WITH CHECK (
        option_id IN (
            SELECT id FROM options WHERE question_id IN (
                SELECT id FROM questions WHERE quiz_id IN (
                    SELECT id FROM quizzes WHERE created_by = auth.jwt()->>'sub'
                )
            )
        )
    );

-- RLS policies for vibe_results
CREATE POLICY "Users can see their own vibe results" ON vibe_results
    FOR SELECT USING (
        submission_id IN (SELECT id FROM quiz_submissions WHERE user_id = auth.jwt()->>'sub')
    );

CREATE POLICY "Quiz creators can see vibe results for their quizzes" ON vibe_results
    FOR SELECT USING (
        submission_id IN (
            SELECT id FROM quiz_submissions WHERE quiz_id IN (
                SELECT id FROM quizzes WHERE created_by = auth.jwt()->>'sub'
            )
        )
    );

CREATE POLICY "Users can insert their own vibe results" ON vibe_results
    FOR INSERT WITH CHECK (
        submission_id IN (SELECT id FROM quiz_submissions WHERE user_id = auth.jwt()->>'sub')
    );

-- Fix permissions issue: update policy to allow users to submit quizzes they haven't created
DROP POLICY IF EXISTS "Users can insert their own submissions" ON quiz_submissions;

CREATE POLICY "Users can submit any quiz" ON quiz_submissions
    FOR INSERT WITH CHECK (true);

-- Update options table to handle options with no correct answer (for vibe quizzes)
ALTER TABLE options ALTER COLUMN is_correct DROP NOT NULL;

-- Check if vibe_results table exists, if not create it
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
    ELSE
        -- If the table exists but the column doesn't, add it
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'vibe_results' AND column_name = 'analyzed_by') THEN
            ALTER TABLE vibe_results ADD COLUMN analyzed_by TEXT NOT NULL DEFAULT 'ai';
        END IF;
    END IF;
END $$; 