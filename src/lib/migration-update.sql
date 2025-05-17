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