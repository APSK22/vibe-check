import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { generateQuiz } from "@/lib/gemini";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  console.log('[Quiz API] Received request to generate quiz');
  
  try {
    // Test Clerk authentication
    console.log('[Quiz API] Checking authentication with Clerk');
    const { userId } = getAuth(req);
    
    if (userId) {
      console.log('[Quiz API] User authenticated:', userId);
    } else {
      console.log('[Quiz API] No authenticated user found');
    }
    
    // Check authentication
    if (!userId) {
      console.log('[Quiz API] Unauthorized access attempt');
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get request data
    const { topic, numQuestions, difficulty, visibility, title, quizType = "scored" } = await req.json();
    console.log('[Quiz API] Request data:', { topic, numQuestions, difficulty, visibility, title, quizType });
    
    // Validate inputs
    if (!topic || !numQuestions || !difficulty || !visibility) {
      console.log('[Quiz API] Missing required fields');
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Generate quiz with Google GenAI
    console.log('[Quiz API] Generating quiz with Google GenAI');
    
    try {
      const quizData = await generateQuiz(
        topic,
        Number(numQuestions),
        difficulty as "easy" | "medium" | "hard",
        quizType as "scored" | "vibe"
      );
      
      console.log('[Quiz API] Quiz generated successfully with', quizData.questions.length, 'questions');
      console.log('[Quiz API] First question sample:', quizData.questions[0]?.question);
      console.log('[Quiz API] Quiz type:', quizData.quizType);
      
      // Create a supabase client
      console.log('[Quiz API] Creating Supabase client');
      const supabase = await createClient();
      
      // Insert quiz into database
      console.log('[Quiz API] Inserting quiz into database');
      const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .insert({
          title: title || quizData.title,
          description: `A ${difficulty} difficulty ${quizData.quizType === "vibe" ? "vibe check" : ""} quiz about ${topic}`,
          is_public: visibility === "public",
          created_by: userId,
          quiz_type: quizData.quizType
        })
        .select()
        .single();
      
      if (quizError) {
        console.error('[Quiz API] Error creating quiz:', quizError);
        return NextResponse.json(
          { error: "Failed to create quiz", details: quizError },
          { status: 500 }
        );
      }
      
      console.log('[Quiz API] Quiz record created:', quiz.id);
      
      // Check if we have questions to insert
      if (!quizData.questions || quizData.questions.length === 0) {
        console.error('[Quiz API] No questions were generated');
        return NextResponse.json(
          { error: "No questions were generated" },
          { status: 500 }
        );
      }
      
      // Insert questions and options
      let insertedQuestions = 0;
      console.log('[Quiz API] Inserting questions and options');
      
      for (let index = 0; index < quizData.questions.length; index++) {
        const questionData = quizData.questions[index];
        
        // Insert question
        console.log('[Quiz API] Inserting question', index + 1, questionData.question.substring(0, 30) + '...');
        
        try {
          const { data: question, error: questionError } = await supabase
            .from("questions")
            .insert({
              quiz_id: quiz.id,
              question: questionData.question,
              order_num: index + 1,
            })
            .select()
            .single();
          
          if (questionError) {
            console.error('[Quiz API] Error creating question:', questionError);
            continue;
          }
          
          console.log('[Quiz API] Question inserted with ID:', question.id);
          
          // Insert options
          console.log('[Quiz API] Inserting', questionData.options.length, 'options for question', index + 1);
          
          let insertedOptions = 0;
          for (let optIndex = 0; optIndex < questionData.options.length; optIndex++) {
            const option = questionData.options[optIndex];
            
            try {
              // Insert option
              const { data: insertedOption, error: optionError } = await supabase
                .from("options")
                .insert({
                  question_id: question.id,
                  option_text: option.text,
                  is_correct: quizData.quizType === "scored" ? option.isCorrect : null,
                  order_num: optIndex + 1,
                })
                .select()
                .single();
              
              if (optionError) {
                console.error('[Quiz API] Error creating option:', optionError);
              } else {
                insertedOptions++;
                
                // For vibe check quizzes, store the option interpretations
                if (quizData.quizType === "vibe" && option.vibeCategory && option.vibeValue) {
                  const { error: interpError } = await supabase
                    .from("option_interpretations")
                    .insert({
                      option_id: insertedOption.id,
                      vibe_category: option.vibeCategory,
                      vibe_value: option.vibeValue
                    });
                    
                  if (interpError) {
                    console.error('[Quiz API] Error creating option interpretation:', interpError);
                  }
                }
              }
            } catch (optError) {
              console.error('[Quiz API] Exception inserting option:', optError);
            }
          }
          
          console.log('[Quiz API] Inserted', insertedOptions, 'out of', questionData.options.length, 'options');
          
          if (insertedOptions > 0) {
            insertedQuestions++;
          }
        } catch (questionInsertError) {
          console.error('[Quiz API] Exception inserting question:', questionInsertError);
        }
      }
      
      console.log('[Quiz API] Inserted', insertedQuestions, 'out of', quizData.questions.length, 'questions');
      
      if (insertedQuestions === 0) {
        console.error('[Quiz API] Failed to insert any questions');
        return NextResponse.json({
          success: true,
          quizId: quiz.id,
          warning: "Quiz was created but no questions could be inserted",
          message: "Quiz generated with warnings",
        });
      }
      
      console.log('[Quiz API] Quiz generation completed successfully');
      return NextResponse.json({
        success: true,
        quizId: quiz.id,
        questionsInserted: insertedQuestions,
        quizType: quizData.quizType,
        message: "Quiz generated successfully",
      });
    } catch (innerError) {
      console.error('[Quiz API] Error processing quiz generation:', innerError);
      return NextResponse.json(
        { error: "Failed to process quiz generation", details: String(innerError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Quiz API] Error in quiz generation:', error);
    return NextResponse.json(
      { error: "Failed to generate quiz", details: String(error) },
      { status: 500 }
    );
  }
} 