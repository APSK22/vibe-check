-- Check if users table has username column, add it if not
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'username'
    ) THEN
        ALTER TABLE users ADD COLUMN username TEXT;
    END IF;
END $$;

-- CLERK USERS INTEGRATION: Populate username from Clerk
-- This function will need to be called when a user is created via a trigger or API call
CREATE OR REPLACE FUNCTION update_user_from_clerk()
RETURNS TRIGGER AS $$
BEGIN
    -- Here we just ensure the username field is available
    -- In production, you'd pull this from Clerk via API
    IF NEW.username IS NULL THEN
        NEW.username = 'User ' || substring(NEW.id, 1, 8);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to apply username updates
DROP TRIGGER IF EXISTS ensure_username_trigger ON users;
CREATE TRIGGER ensure_username_trigger
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_user_from_clerk();

-- VERIFY QUIZ_SUBMISSIONS TABLE STRUCTURE
-- Check if quiz_submissions exists, create it if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'quiz_submissions') THEN
        CREATE TABLE quiz_submissions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
            user_id TEXT NOT NULL,
            score INTEGER NOT NULL DEFAULT 0,
            max_score INTEGER NOT NULL,
            completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Enable RLS
        ALTER TABLE quiz_submissions ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Users can see their own submissions" ON quiz_submissions
            FOR SELECT USING (user_id = auth.jwt()->>'sub');
            
        CREATE POLICY "Quiz creators can see submissions for their quizzes" ON quiz_submissions
            FOR SELECT USING (
                quiz_id IN (SELECT id FROM quizzes WHERE created_by = auth.jwt()->>'sub')
            );
            
        CREATE POLICY "Users can submit any quiz" ON quiz_submissions
            FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- VERIFY USER_ANSWERS TABLE STRUCTURE
-- Check if user_answers exists, create it if not 
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_answers') THEN
        CREATE TABLE user_answers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            submission_id UUID REFERENCES quiz_submissions(id) ON DELETE CASCADE,
            question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
            selected_option_id UUID REFERENCES options(id) ON DELETE CASCADE,
            is_correct BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Enable RLS
        ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Users can see their own answers" ON user_answers
            FOR SELECT USING (
                submission_id IN (SELECT id FROM quiz_submissions WHERE user_id = auth.jwt()->>'sub')
            );
            
        CREATE POLICY "Quiz creators can see answers to their quizzes" ON user_answers
            FOR SELECT USING (
                question_id IN (
                    SELECT id FROM questions WHERE quiz_id IN (
                        SELECT id FROM quizzes WHERE created_by = auth.jwt()->>'sub'
                    )
                )
            );
            
        CREATE POLICY "Users can insert their own answers" ON user_answers
            FOR INSERT WITH CHECK (
                submission_id IN (SELECT id FROM quiz_submissions WHERE user_id = auth.jwt()->>'sub')
            );
    END IF;
END $$;

-- VERIFY VIBE_RESULTS TABLE STRUCTURE
-- Check if vibe_results exists, create it if not
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

-- Fix columns if they exist but with wrong structure
DO $$
BEGIN
    -- Make sure quiz_type exists in quizzes table
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