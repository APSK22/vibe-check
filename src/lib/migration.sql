-- Users table (connecting with Clerk)
CREATE TABLE users (
    id TEXT PRIMARY KEY, -- Clerk user ID
    email TEXT NOT NULL,
    username TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Quizzes table
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_by TEXT NOT NULL DEFAULT auth.jwt()->>'sub',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Questions table
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    order_num INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Options table
CREATE TABLE options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    order_num INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Quiz submissions table
CREATE TABLE quiz_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL DEFAULT auth.jwt()->>'sub',
    score INTEGER NOT NULL DEFAULT 0,
    max_score INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User answers table
CREATE TABLE user_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES quiz_submissions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    selected_option_id UUID REFERENCES options(id) ON DELETE CASCADE,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE options ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users Policy
CREATE POLICY "Users can see all users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (id = auth.jwt()->>'sub');

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (id = auth.jwt()->>'sub');

-- Quizzes Policies
CREATE POLICY "Users can see public quizzes" ON quizzes
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can see their own quizzes" ON quizzes
    FOR SELECT USING (created_by = auth.jwt()->>'sub');

CREATE POLICY "Users can insert their own quizzes" ON quizzes
    FOR INSERT WITH CHECK (created_by = auth.jwt()->>'sub');

CREATE POLICY "Users can update their own quizzes" ON quizzes
    FOR UPDATE USING (created_by = auth.jwt()->>'sub');

CREATE POLICY "Users can delete their own quizzes" ON quizzes
    FOR DELETE USING (created_by = auth.jwt()->>'sub');

-- Questions Policies
CREATE POLICY "Users can see questions for public quizzes" ON questions
    FOR SELECT USING (
        quiz_id IN (SELECT id FROM quizzes WHERE is_public = true)
    );

CREATE POLICY "Users can see questions for their own quizzes" ON questions
    FOR SELECT USING (
        quiz_id IN (SELECT id FROM quizzes WHERE created_by = auth.jwt()->>'sub')
    );

CREATE POLICY "Users can insert questions for their own quizzes" ON questions
    FOR INSERT WITH CHECK (
        quiz_id IN (SELECT id FROM quizzes WHERE created_by = auth.jwt()->>'sub')
    );

CREATE POLICY "Users can update questions for their own quizzes" ON questions
    FOR UPDATE USING (
        quiz_id IN (SELECT id FROM quizzes WHERE created_by = auth.jwt()->>'sub')
    );

CREATE POLICY "Users can delete questions for their own quizzes" ON questions
    FOR DELETE USING (
        quiz_id IN (SELECT id FROM quizzes WHERE created_by = auth.jwt()->>'sub')
    );

-- Options Policies
CREATE POLICY "Users can see options for public quiz questions" ON options
    FOR SELECT USING (
        question_id IN (
            SELECT id FROM questions WHERE quiz_id IN (
                SELECT id FROM quizzes WHERE is_public = true
            )
        )
    );

CREATE POLICY "Users can see options for their own quiz questions" ON options
    FOR SELECT USING (
        question_id IN (
            SELECT id FROM questions WHERE quiz_id IN (
                SELECT id FROM quizzes WHERE created_by = auth.jwt()->>'sub')
        )
    );

CREATE POLICY "Users can insert options for their own quiz questions" ON options
    FOR INSERT WITH CHECK (
        question_id IN (
            SELECT id FROM questions WHERE quiz_id IN (
                SELECT id FROM quizzes WHERE created_by = auth.jwt()->>'sub')
        )
    );

CREATE POLICY "Users can update options for their own quiz questions" ON options
    FOR UPDATE USING (
        question_id IN (
            SELECT id FROM questions WHERE quiz_id IN (
                SELECT id FROM quizzes WHERE created_by = auth.jwt()->>'sub')
        )
    );

CREATE POLICY "Users can delete options for their own quiz questions" ON options
    FOR DELETE USING (
        question_id IN (
            SELECT id FROM questions WHERE quiz_id IN (
                SELECT id FROM quizzes WHERE created_by = auth.jwt()->>'sub')
        )
    );

-- Quiz Submissions Policies
CREATE POLICY "Users can see their own submissions" ON quiz_submissions
    FOR SELECT USING (user_id = auth.jwt()->>'sub');

CREATE POLICY "Users can see submissions for their quizzes" ON quiz_submissions
    FOR SELECT USING (
        quiz_id IN (SELECT id FROM quizzes WHERE created_by = auth.jwt()->>'sub')
    );

CREATE POLICY "Users can insert their own submissions" ON quiz_submissions
    FOR INSERT WITH CHECK (user_id = auth.jwt()->>'sub');

-- User Answers Policies
CREATE POLICY "Users can see their own answers" ON user_answers
    FOR SELECT USING (
        submission_id IN (SELECT id FROM quiz_submissions WHERE user_id = auth.jwt()->>'sub')
    );

CREATE POLICY "Users can see answers for submissions to their quizzes" ON user_answers
    FOR SELECT USING (
        submission_id IN (
            SELECT id FROM quiz_submissions WHERE quiz_id IN (
                SELECT id FROM quizzes WHERE created_by = auth.jwt()->>'sub')
        )
    );

CREATE POLICY "Users can insert their own answers" ON user_answers
    FOR INSERT WITH CHECK (
        submission_id IN (SELECT id FROM quiz_submissions WHERE user_id = auth.jwt()->>'sub')
    );