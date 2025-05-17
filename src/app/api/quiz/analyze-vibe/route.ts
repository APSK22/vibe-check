import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase-server";
import { generateVibeAnalysis } from "@/lib/gemini";

interface Option {
  id: string;
  question_id: string;
  option_text: string;
  order_num: number;
  option_interpretations: Array<{
    vibe_category: string;
    vibe_value: string;
  }>;
}

// These interfaces match the ones in gemini.ts
interface QuizOption {
  text: string;
  isCorrect: boolean;
  vibeCategory?: string;
  vibeValue?: string;
}

interface QuizQuestion {
  question: string;
  options: QuizOption[];
}

export async function POST(req: NextRequest) {
  console.log('[Vibe Analysis API] Received request');
  
  try {
    // Check authentication
    console.log('[Vibe Analysis API] Checking authentication with Clerk');
    const { userId } = getAuth(req);
    
    // Get request data
    const { submissionId, quizId } = await req.json();
    console.log('[Vibe Analysis API] Request data:', { submissionId, quizId });
    
    if (!submissionId || !quizId) {
      console.log('[Vibe Analysis API] Missing required fields');
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Create a supabase client
    console.log('[Vibe Analysis API] Creating Supabase client');
    const supabase = await createClient();
    
    // Fetch the quiz details to confirm it's a vibe quiz
    console.log('[Vibe Analysis API] Fetching quiz details');
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", quizId)
      .single();
      
    if (quizError) {
      console.error('[Vibe Analysis API] Error fetching quiz:', quizError);
      return NextResponse.json(
        { error: "Failed to fetch quiz" },
        { status: 500 }
      );
    }
    
    // Check if this is a vibe quiz
    if (quiz.quiz_type !== 'vibe') {
      console.error('[Vibe Analysis API] Not a vibe quiz');
      return NextResponse.json(
        { error: "This is not a vibe check quiz" },
        { status: 400 }
      );
    }
    
    // Fetch all questions for this quiz
    console.log('[Vibe Analysis API] Fetching quiz questions');
    const { data: questions, error: questionsError } = await supabase
      .from("questions")
      .select("id, question, order_num")
      .eq("quiz_id", quizId)
      .order("order_num");
      
    if (questionsError) {
      console.error('[Vibe Analysis API] Error fetching questions:', questionsError);
      return NextResponse.json(
        { error: "Failed to fetch quiz questions" },
        { status: 500 }
      );
    }
    
    // Fetch all options with their vibe interpretations
    const questionIds = questions.map(q => q.id);
    const { data: options, error: optionsError } = await supabase
      .from("options")
      .select(`
        id, 
        question_id, 
        option_text, 
        order_num,
        option_interpretations (
          vibe_category,
          vibe_value
        )
      `)
      .in("question_id", questionIds);
      
    if (optionsError) {
      console.error('[Vibe Analysis API] Error fetching options:', optionsError);
      return NextResponse.json(
        { error: "Failed to fetch quiz options" },
        { status: 500 }
      );
    }
    
    // Fetch user's answers
    console.log('[Vibe Analysis API] Fetching user answers');
    const { data: userAnswers, error: answersError } = await supabase
      .from("user_answers")
      .select("question_id, selected_option_id")
      .eq("submission_id", submissionId);
      
    if (answersError || !userAnswers) {
      console.error('[Vibe Analysis API] Error fetching user answers:', answersError);
      return NextResponse.json(
        { error: "Failed to fetch user answers" },
        { status: 500 }
      );
    }
    
    // Organize options by question_id
    const optionsByQuestion = new Map<string, Option[]>();
    options.forEach(option => {
      if (!optionsByQuestion.has(option.question_id)) {
        optionsByQuestion.set(option.question_id, []);
      }
      optionsByQuestion.get(option.question_id)?.push(option);
    });
    
    // Prepare data for the Gemini API - conform to QuizQuestion interface
    const questionData: QuizQuestion[] = questions.map(q => {
      const questionOptions = optionsByQuestion.get(q.id) || [];
      questionOptions.sort((a: Option, b: Option) => a.order_num - b.order_num);
      
      return {
        question: q.question,
        options: questionOptions.map((opt: Option): QuizOption => ({
          text: opt.option_text,
          isCorrect: false, // Vibe check quizzes don't have correct answers
          vibeCategory: opt.option_interpretations[0]?.vibe_category || "general",
          vibeValue: opt.option_interpretations[0]?.vibe_value || "neutral"
        }))
      };
    });
    
    // Map user answers to question indices
    const userAnswerIndices: number[] = [];
    questions.forEach((q) => {
      const answer = userAnswers.find(a => a.question_id === q.id);
      if (answer) {
        const options = optionsByQuestion.get(q.id) || [];
        const optionIndex = options.findIndex((o: Option) => o.id === answer.selected_option_id);
        if (optionIndex !== -1) {
          userAnswerIndices.push(optionIndex);
        } else {
          // Default to first option if not found
          userAnswerIndices.push(0);
        }
      } else {
        // Default to first option if not answered
        userAnswerIndices.push(0);
      }
    });
    
    // Generate vibe analysis
    console.log('[Vibe Analysis API] Generating vibe analysis with Gemini');
    const topic = quiz.title.replace(' Vibe Check', '').replace(' Quiz', '');
    const vibeAnalysis = await generateVibeAnalysis(
      topic,
      questionData,
      userAnswerIndices
    );
    
    // Save vibe analysis to database
    console.log('[Vibe Analysis API] Saving vibe analysis');
    const { error: saveError } = await supabase
      .from("vibe_results")
      .insert({
        submission_id: submissionId,
        quiz_id: quizId,
        user_id: userId || 'anonymous',
        vibe_analysis: vibeAnalysis.vibeAnalysis,
        vibe_categories: vibeAnalysis.vibeCategories || {},
        analyzed_by: 'ai'
      });
      
    if (saveError) {
      console.error('[Vibe Analysis API] Error saving vibe analysis:', saveError);
      return NextResponse.json(
        { error: "Failed to save vibe analysis" },
        { status: 500 }
      );
    }
    
    console.log('[Vibe Analysis API] Vibe analysis generated and saved successfully');
    return NextResponse.json({
      success: true,
      submissionId,
      vibeAnalysis
    });
  } catch (error) {
    console.error('[Vibe Analysis API] Error in vibe analysis:', error);
    return NextResponse.json(
      { error: "Failed to generate vibe analysis", details: String(error) },
      { status: 500 }
    );
  }
} 