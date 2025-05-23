import { GoogleGenAI } from "@google/genai";

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

interface QuizData {
  title: string;
  questions: QuizQuestion[];
  quizType: "scored" | "vibe";
}

interface VibeAnalysis {
  vibeAnalysis: string;
  vibeCategories?: Record<string, string>;
}

// Simple helper for error handling
const handleAPIError = (error: unknown) => {
  console.error('Gemini API error:', error);
  if (error instanceof Error) {
    if (error.message.includes('API key')) {
      return "Missing or invalid API key. Please check your environment variables.";
    }
    if (error.message.includes('quota')) {
      return "API quota exceeded. Please try again later.";
    }
    return `API error: ${error.message}`;
  }
  return "An unknown error occurred while contacting the Gemini API.";
};

// Initialize the Generative AI object
const getAI = () => {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("Missing Gemini API key in environment variables");
  }
  
  return new GoogleGenAI({ apiKey });
};

// Generate a quiz based on the provided parameters
export async function generateQuiz(
  topic: string, 
  numQuestions: number, 
  difficulty: string, 
  quizType: "scored" | "vibe" = "scored"
): Promise<QuizData> {
  try {
    const ai = getAI();
    
    // Different prompts based on quiz type
    let prompt = "";
    
    if (quizType === "scored") {
      // Traditional quiz with correct answers
      prompt = `
      Create a multiple choice quiz about ${topic} with exactly ${numQuestions} questions.
      Difficulty level: ${difficulty}.
      
      Each question must have EXACTLY 4 options, with only ONE correct answer.
      
      Format your response as VALID JSON following this structure exactly:
      {
        "title": "${topic} Quiz",
        "questions": [
          {
            "question": "What is the capital of France?",
            "options": [
              {"text": "Berlin", "isCorrect": false},
              {"text": "Madrid", "isCorrect": false},
              {"text": "Paris", "isCorrect": true},
              {"text": "Rome", "isCorrect": false}
            ]
          }
          ],
          "quizType": "scored"
      }
      
      DO NOT include any text before or after the JSON. Return ONLY the JSON.
    `;
    } else {
      // Vibe check quiz without correct answers
      prompt = `
        Create a "vibe check" opinion quiz about ${topic} with exactly ${numQuestions} questions.
        The quiz should assess the user's personality, preferences, or opinions about ${topic}.
        Difficulty level: ${difficulty}.
        
        Each question must have EXACTLY 4 options, with NO correct answers.
        Instead, each option should reveal something about the user's personality or vibe.
        
        For each option, include:
        - "vibeCategory": A category this option relates to (e.g., "enthusiasm", "knowledge", "humor style")
        - "vibeValue": The specific value within that category (e.g., "high", "nostalgic", "ironic")
        
        Format your response as VALID JSON following this structure exactly:
        {
          "title": "${topic} Vibe Check",
          "questions": [
            {
              "question": "Which ${topic} element resonates with you most?",
              "options": [
                {
                  "text": "Option description here", 
                  "vibeCategory": "enthusiasm", 
                  "vibeValue": "passionate"
                },
                {
                  "text": "Option description here", 
                  "vibeCategory": "approach", 
                  "vibeValue": "analytical"
                },
                {
                  "text": "Option description here", 
                  "vibeCategory": "style", 
                  "vibeValue": "nostalgic"
                },
                {
                  "text": "Option description here", 
                  "vibeCategory": "interest", 
                  "vibeValue": "casual"
                }
              ]
            }
          ],
          "quizType": "vibe"
        }
        
        DO NOT include any text before or after the JSON. Return ONLY the JSON.
      `;
    }

    // Generate content from the model using the new API pattern
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    
    const text = response.text ?? '';
    console.log("Raw Gemini response:", text.substring(0, 200) + "...");
    
    // Try direct parsing first
    try {
      const quizData = JSON.parse(text) as QuizData;
      return validateAndFixQuizData(quizData, topic, quizType);
    } catch (parseError) {
      console.error("Failed direct JSON parsing, trying to extract JSON:", parseError);
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse JSON from the Gemini response");
      }
      
      try {
        // Parse the JSON and validate the structure
        const quizData = JSON.parse(jsonMatch[0]) as QuizData;
        return validateAndFixQuizData(quizData, topic, quizType);
      } catch (secondParseError) {
        console.error("Failed second JSON parsing attempt:", secondParseError);
        throw new Error("Could not parse valid JSON from the response");
      }
    }
  } catch (error) {
    const errorMessage = handleAPIError(error);
    throw new Error(errorMessage);
  }
}

// Validate and fix quiz data if possible
function validateAndFixQuizData(quizData: QuizData, topic: string, quizType: "scored" | "vibe"): QuizData {
  // Make sure there's a title
  if (!quizData.title) {
    quizData.title = quizType === "scored" ? `${topic} Quiz` : `${topic} Vibe Check`;
  }
  
  // Ensure quizType is set correctly
  quizData.quizType = quizType;
  
  // Make sure questions array exists
  if (!Array.isArray(quizData.questions) || quizData.questions.length === 0) {
    throw new Error("The quiz must have at least one question");
  }
  
  // Check and fix each question
  for (let i = 0; i < quizData.questions.length; i++) {
    const q = quizData.questions[i];
    
    // Ensure question has text
    if (!q.question || typeof q.question !== 'string') {
      q.question = `Question ${i+1} about ${topic}`;
    }
    
    // Ensure options exist and are exactly 4
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      throw new Error(`Question ${i+1} must have exactly 4 options`);
    }
    
    // Handle quiz-type-specific validation
    if (quizType === "scored") {
    // Check for correct answers
    const correctOptions = q.options.filter(opt => opt.isCorrect);
    if (correctOptions.length !== 1) {
      // Fix: Mark the first option as correct if none or multiple are marked
      q.options.forEach((opt, index) => {
        opt.isCorrect = index === 0;
      });
      }
    } else {
      // For vibe quizzes, ensure vibeCategory and vibeValue exist
      for (let j = 0; j < q.options.length; j++) {
        const opt = q.options[j];
        if (!opt.vibeCategory || typeof opt.vibeCategory !== 'string') {
          opt.vibeCategory = "general";
        }
        if (!opt.vibeValue || typeof opt.vibeValue !== 'string') {
          opt.vibeValue = "neutral";
        }
      }
    }
  }
  
  return quizData;
}

// Generate a vibe analysis based on user answers
export async function generateVibeAnalysis(
  topic: string,
  questions: QuizQuestion[],
  userAnswers: number[]
): Promise<VibeAnalysis> {
  try {
    const ai = getAI();
    
    // Collect the selected vibe categories and values
    const selectedVibes = userAnswers.map((answerIndex, questionIndex) => {
      const question = questions[questionIndex];
      const selectedOption = question.options[answerIndex];
      
      return {
        question: question.question,
        answer: selectedOption.text,
        vibeCategory: selectedOption.vibeCategory || "general",
        vibeValue: selectedOption.vibeValue || "neutral"
      };
    });
    
    const prompt = `
      Analyze the following quiz responses about "${topic}" and generate a fun, insightful "vibe check" analysis.
      
      User's answers:
      ${selectedVibes.map(v => `- Question: "${v.question}" | Answer: "${v.answer}" | Category: ${v.vibeCategory} | Value: ${v.vibeValue}`).join('\n')}
      
      Based on these answers, create a personality analysis about the user's relationship with ${topic}.
      Make it fun, insightful, and between 100-200 words.
      
      Also categorize the user's overall vibe into relevant categories.
      
      Format your response as VALID JSON following this structure:
      {
        "vibeAnalysis": "A fun, creative analysis of the person's relationship with ${topic}...",
        "vibeCategories": {
          "enthusiasm": "high",
          "knowledge": "expert",
          "approach": "nostalgic"
          // Add other relevant categories
        }
      }
      
      DO NOT include any text before or after the JSON. Return ONLY the JSON.
    `;
    
    // Generate content from the model
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    
    const text = response.text ?? '';
    console.log("Raw Gemini response for vibe analysis:", text.substring(0, 200) + "...");
    
    // Try direct parsing first
    try {
      return JSON.parse(text) as VibeAnalysis;
    } catch (parseError) {
      console.error("Failed direct JSON parsing, trying to extract JSON:", parseError);
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse JSON from the Gemini response");
      }
      
      try {
        return JSON.parse(jsonMatch[0]) as VibeAnalysis;
      } catch (secondParseError) {
        console.error("Failed second JSON parsing attempt:", secondParseError);
        
        // Fallback to a simple analysis
        return {
          vibeAnalysis: "Based on your answers, you seem to have an interesting relationship with " + topic + ". Your vibe is unique and defies simple categorization!"
        };
      }
    }
  } catch (error) {
    const errorMessage = handleAPIError(error);
    return {
      vibeAnalysis: "We couldn't generate your vibe analysis at this time. Please try again later. Error: " + errorMessage
    };
  }
} 