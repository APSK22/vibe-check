import { GoogleGenAI } from "@google/genai";

interface QuizOption {
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  question: string;
  options: QuizOption[];
}

interface QuizData {
  title: string;
  questions: QuizQuestion[];
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
export async function generateQuiz(topic: string, numQuestions: number, difficulty: string): Promise<QuizData> {
  try {
    const ai = getAI();
    
    // Simplified prompt with very clear output format
    const prompt = `
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
        ]
      }
      
      DO NOT include any text before or after the JSON. Return ONLY the JSON.
    `;

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
      return validateAndFixQuizData(quizData, topic);
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
        return validateAndFixQuizData(quizData, topic);
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
function validateAndFixQuizData(quizData: QuizData, topic: string): QuizData {
  // Make sure there's a title
  if (!quizData.title) {
    quizData.title = `${topic} Quiz`;
  }
  
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
    
    // Check for correct answers
    const correctOptions = q.options.filter(opt => opt.isCorrect);
    if (correctOptions.length !== 1) {
      // Fix: Mark the first option as correct if none or multiple are marked
      q.options.forEach((opt, index) => {
        opt.isCorrect = index === 0;
      });
    }
  }
  
  return quizData;
} 