"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSupabase } from "@/lib/supabase";
import { useUser, useClerk } from "@clerk/nextjs";
import { ArrowLeft, ArrowRight, Check, Clock, Award, AlertCircle, UserIcon } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface Option {
  id: string;
  option_text: string;
  is_correct: boolean;
}

interface Question {
  id: string;
  question: string;
  options: Option[];
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  created_at: string;
  created_by: string;
  quiz_type: "scored" | "vibe";
  questions: Question[];
}

interface VibeAnalysis {
  vibeAnalysis: string;
  vibeCategories?: Record<string, string>;
}

export default function TakeQuizPage() {
  const params = useParams();
  const quizId = params?.id as string;
  const supabase = useSupabase();
  const { user, isLoaded, isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [vibeAnalysis, setVibeAnalysis] = useState<VibeAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  
  // Load quiz data
  useEffect(() => {
    async function loadQuizData() {
      if (!quizId) return;
      
      try {
        setIsLoading(true);
        // Clear any previous errors
        setError(null);
        
        console.log(`[Quiz Take] Loading quiz ${quizId}`);
        
        // Use the new access API endpoint for direct link access
        const response = await fetch("/api/quiz/access", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ quizId }),
        });
        
        console.log(`[Quiz Take] API response status: ${response.status}`);
        
        const data = await response.json();
        console.log(`[Quiz Take] Response data:`, data);
        
        if (!response.ok) {
          console.error('[Quiz Take] Error fetching quiz:', data);
          
          if (response.status === 404) {
            setError('Quiz not found. It may have been deleted by the creator.');
          } else {
            setError(data.error || 'Failed to load quiz');
          }
          
          setIsLoading(false);
          return;
        }
        
        if (!data.success || !data.quiz) {
          console.error('[Quiz Take] Invalid response format:', data);
          setError('Invalid response from server');
          setIsLoading(false);
          return;
        }
        
        console.log(`[Quiz Take] Quiz loaded successfully with ${data.quiz.questions?.length || 0} questions`);
        
        // Set the quiz data
        setQuiz(data.quiz);
        
        // Initialize start time
        setStartTime(Date.now());
        
      } catch (error) {
        console.error('[Quiz Take] Error in loadQuizData:', error);
        setError('An unexpected error occurred while loading the quiz');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadQuizData();
  }, [quizId]);
  
  // Timer for tracking time spent
  useEffect(() => {
    if (!startTime || quizCompleted) return;
    
    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [startTime, quizCompleted]);
  
  // Set the selected option whenever the current question changes
  useEffect(() => {
    if (!quiz || !quiz.questions[currentQuestionIndex]) return;
    
    const currentQuestionId = quiz.questions[currentQuestionIndex].id;
    const previouslySelectedOption = userAnswers[currentQuestionId];
    
    setSelectedOption(previouslySelectedOption || null);
  }, [currentQuestionIndex, quiz, userAnswers]);
  
  // If not signed in, show sign-in prompt
  if (isLoaded && !isSignedIn) {
    return (
      <div className="max-w-md mx-auto my-8 p-6">
        <Card className="bg-gray-900 border-blue-500/30">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-white">Sign in to Take the Quiz</CardTitle>
            <CardDescription className="text-blue-300">
              You need to be signed in to take &ldquo;{quiz?.title || 'this quiz'}&rdquo;
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <UserIcon className="h-12 w-12 text-blue-400 mb-2" />
            <p className="text-gray-300 text-center mb-4">
              Sign in to track your progress, save your scores, and see your results.
            </p>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                // Use a direct approach with redirectUrl
                openSignIn({
                  redirectUrl: window.location.href
                });
              }}
            >
              Sign In to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleOptionSelect = (optionId: string) => {
    if (quizCompleted) return;
    
    setSelectedOption(optionId);
    const currentQuestion = quiz?.questions[currentQuestionIndex];
    
    if (currentQuestion) {
      setUserAnswers({
        ...userAnswers,
        [currentQuestion.id]: optionId
      });
    }
  };
  
  const goToNextQuestion = () => {
    if (!quiz || currentQuestionIndex >= quiz.questions.length - 1) {
      return;
    }
    
    setCurrentQuestionIndex(currentQuestionIndex + 1);
  };
  
  const goToPreviousQuestion = () => {
    if (currentQuestionIndex <= 0) {
      return;
    }
    
    setCurrentQuestionIndex(currentQuestionIndex - 1);
  };
  
  const calculateScore = () => {
    if (!quiz) return { correct: 0, total: 0 };
    
    // If it's a vibe quiz, don't calculate a score
    if (quiz.quiz_type === "vibe") {
      return { correct: 0, total: quiz.questions.length };
    }
    
    let correctAnswers = 0;
    const totalQuestions = quiz.questions.length;
    
    quiz.questions.forEach(question => {
      const selectedOptionId = userAnswers[question.id];
      const correctOption = question.options.find(option => option.is_correct);
      
      if (selectedOptionId && correctOption && selectedOptionId === correctOption.id) {
        correctAnswers++;
      }
    });
    
    return { correct: correctAnswers, total: totalQuestions };
  };
  
  const fetchVibeAnalysis = async (submissionId: string) => {
    setLoadingAnalysis(true);
    
    try {
      const response = await fetch("/api/quiz/analyze-vibe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId,
          quizId
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to analyze vibe");
      }
      
      const data = await response.json();
      setVibeAnalysis(data.vibeAnalysis);
      
      // Trigger a celebratory confetti effect for vibe results
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
    } catch (error) {
      console.error("Error fetching vibe analysis:", error);
      toast.error("Failed to generate vibe analysis");
    } finally {
      setLoadingAnalysis(false);
    }
  };
  
  const handleSubmitQuiz = async () => {
    if (!quiz || !user) return;
    
    // Check if all questions have been answered
    const unansweredQuestions = quiz.questions.filter(q => !userAnswers[q.id]);
    
    if (unansweredQuestions.length > 0) {
      if (!window.confirm(`You have ${unansweredQuestions.length} unanswered questions. Are you sure you want to submit?`)) {
        return;
      }
    }
    
    setSubmitting(true);
    
    try {
      const finalScore = calculateScore();
      setScore(finalScore);
      
      // Use our API to record the submission
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quizId,
          userId: user.id,
          score: finalScore.correct,
          maxScore: finalScore.total,
          answers: userAnswers,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        console.error('Error recording submission:', data.error);
        throw new Error('Failed to record submission');
      }
      
      // For vibe quizzes, get the vibe analysis
      if (quiz.quiz_type === "vibe" && data.submissionId) {
        await fetchVibeAnalysis(data.submissionId);
      } else {
        // Trigger confetti effect if score is good on scored quizzes
        if (finalScore.correct / finalScore.total >= 0.7) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      }
      
      setQuizCompleted(true);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-blue-300">
          {quiz?.title ? `Loading "${quiz.title}"...` : 'Loading quiz...'}
        </p>
      </div>
    );
  }
  
  if (error || !quiz) {
    return (
      <div className="p-6 bg-gray-900 border border-blue-500/30 rounded-md text-center max-w-2xl mx-auto">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Quiz not found</h2>
        <p className="text-blue-200 mb-4">The quiz you are looking for does not exist or is no longer available.</p>
        <Link href="/dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }
  
  // If the quiz is completed, show the results
  if (quizCompleted) {
    // Handle vibe check quiz results differently
    if (quiz.quiz_type === "vibe") {
      return (
        <div className="max-w-3xl mx-auto px-4 py-6 sm:p-6">
          <Card className="bg-gray-900 border-blue-500/30 overflow-hidden shadow-lg">
            <div className="h-2 bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-500"></div>
            <CardHeader className="text-center">
              <CardTitle className="text-xl md:text-2xl lg:text-3xl text-white">Your Vibe Analysis</CardTitle>
              <CardDescription className="text-blue-200">
                Based on your responses to &ldquo;{quiz.title}&rdquo;
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {loadingAnalysis ? (
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-16 w-16 rounded-full border-t-2 border-b-2 border-blue-400 animate-spin"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-12 w-12 rounded-full border-r-2 border-l-2 border-purple-400 animate-spin animate-reverse"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-8 w-8 rounded-full border-t-2 border-pink-400 animate-spin animate-delay-500"></div>
                    </div>
                  </div>
                  <p className="text-blue-200 text-center">Analyzing your vibe...</p>
                  <div className="text-blue-300/70 text-xs text-center max-w-xs">
                    Google Gemini is interpreting your answers to create a personalized vibe analysis
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-gray-800/50 border border-blue-500/20 rounded-lg p-4 sm:p-6">
                    <h3 className="text-xl font-semibold text-blue-300 mb-3">Your Vibe</h3>
                    <p className="text-white/90 whitespace-pre-line">{vibeAnalysis?.vibeAnalysis}</p>
                  </div>
                  
                  {vibeAnalysis?.vibeCategories && (
                    <div>
                      <h3 className="text-lg font-medium text-blue-300 mb-3">Vibe Categories</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(vibeAnalysis.vibeCategories).map(([category, value]) => (
                          <div 
                            key={category}
                            className="bg-gray-800/40 border border-blue-500/10 rounded-md px-3 py-2 flex justify-between items-center"
                          >
                            <span className="text-gray-300 capitalize">{category}</span>
                            <span className="text-blue-300 font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-800">
                <Link href={`/quiz/${quizId}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Quiz Details
                  </Button>
                </Link>
                <Link href="/dashboard" className="flex-1">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    // Original scored quiz results display
    const percentage = Math.round((score.correct / score.total) * 100);
    
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 sm:p-6">
        <Card className="bg-gray-900 border-blue-500/30 overflow-hidden shadow-lg">
          <div className="h-2 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500"></div>
          <CardHeader className="text-center">
            <CardTitle className="text-xl md:text-2xl lg:text-3xl text-white">Quiz Results</CardTitle>
            <CardDescription className="text-blue-200">
              You have completed &ldquo;{quiz.title}&rdquo;
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center py-4 sm:py-6">
              <div className="relative inline-flex">
                <Award className="h-16 w-16 sm:h-24 sm:w-24 text-yellow-500" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-xl sm:text-2xl font-bold text-white">{percentage}%</div>
                </div>
              </div>
              
              <div className="mt-4 space-y-1">
                <h3 className="text-lg sm:text-xl font-semibold text-white">
                  {
                    percentage >= 80 ? "Excellent!" :
                    percentage >= 60 ? "Good job!" :
                    percentage >= 40 ? "Nice try!" :
                    "Keep practicing!"
                  }
                </h3>
                <p className="text-blue-200">You scored {score.correct} out of {score.total}</p>
                <p className="text-gray-400 text-sm">Time: {formatTime(timeSpent)}</p>
              </div>
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-base sm:text-lg font-medium text-white border-b border-gray-800 pb-2">Question Review</h3>
              
              {quiz.questions.map((question, index) => {
                const userSelectedOptionId = userAnswers[question.id];
                const userSelectedOption = question.options.find(o => o.id === userSelectedOptionId);
                const correctOption = question.options.find(o => o.is_correct);
                const isCorrect = userSelectedOptionId === correctOption?.id;
                
                return (
                  <div key={question.id} className="space-y-2">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className={`flex-shrink-0 rounded-full p-1 ${isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {isCorrect ? <Check className="h-4 w-4 sm:h-5 sm:w-5" /> : <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white text-sm sm:text-base">
                          {index + 1}. {question.question}
                        </p>
                        <div className="mt-1 sm:mt-2 space-y-0.5 sm:space-y-1 text-xs sm:text-sm">
                          <p className="text-gray-400">
                            Your answer: <span className={isCorrect ? "text-green-400" : "text-red-400"}>
                              {userSelectedOption?.option_text || "Not answered"}
                            </span>
                          </p>
                          {!isCorrect && (
                            <p className="text-green-400">
                              Correct answer: {correctOption?.option_text}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-800">
              <Link href={`/quiz/${quizId}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Quiz Details
                </Button>
              </Link>
              <Link href="/dashboard" className="flex-1">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Quiz taking interface
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = (currentQuestionIndex / quiz.questions.length) * 100;
  
  return (
    <div className="max-w-3xl mx-auto px-4 py-2 sm:p-4">
      <div className="mb-4 sm:mb-8 flex items-center justify-between">
        <Link href={`/dashboard`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Exit Quiz
          </Button>
        </Link>
        <div className="flex items-center text-gray-400">
          <Clock className="h-4 w-4 mr-2" />
          {formatTime(timeSpent)}
        </div>
      </div>
      
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 line-clamp-2">{quiz.title}</h1>
        <div className="flex flex-wrap items-center text-sm text-gray-400 mb-3 sm:mb-4 gap-2 sm:gap-0">
          <span className="mr-3">Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
          <span>{Object.keys(userAnswers).length} answered</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      <Card className="bg-gray-900 border-blue-500/30 mb-4 sm:mb-6">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
          <CardTitle className="text-lg sm:text-xl text-white flex items-start gap-3">
            <span className="flex-shrink-0 flex items-center justify-center bg-blue-600 text-white h-6 w-6 sm:h-7 sm:w-7 rounded-full text-sm mt-0.5">
              {currentQuestionIndex + 1}
            </span>
            <span className="flex-1">{currentQuestion.question}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-4 sm:px-6 pb-5">
          {currentQuestion.options.map((option, idx) => (
            <div
              key={option.id}
              onClick={() => handleOptionSelect(option.id)}
              className={`p-3 sm:p-4 rounded-md border transition-all cursor-pointer flex items-center gap-3 ${
                selectedOption === option.id
                  ? "border-blue-500 bg-blue-900/30"
                  : "border-gray-700 bg-gray-800/50 hover:bg-gray-800"
              }`}
            >
              <div className={`h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 rounded-full flex items-center justify-center border ${
                selectedOption === option.id
                  ? "border-blue-500 bg-blue-500 text-white"
                  : "border-gray-600 text-gray-400"
              }`}>
                {String.fromCharCode(65 + idx)}
              </div>
              <span className={`${selectedOption === option.id ? "text-white" : "text-gray-300"} flex-1 text-sm sm:text-base`}>
                {option.option_text}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <Button 
          variant="outline"
          onClick={goToPreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className="px-3 sm:px-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="sm:inline">Previous</span>
        </Button>
        
        {currentQuestionIndex < quiz.questions.length - 1 ? (
          <Button 
            className="bg-blue-600 hover:bg-blue-700 px-3 sm:px-4"
            onClick={goToNextQuestion}
          >
            <span className="sm:inline">Next</span>
            <ArrowRight className="h-4 w-4 ml-1 sm:ml-2" />
          </Button>
        ) : (
          <Button 
            className="bg-green-600 hover:bg-green-700 px-3 sm:px-4"
            onClick={handleSubmitQuiz}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <span>Finish Quiz</span>
                <Check className="h-4 w-4 ml-1 sm:ml-2" />
              </>
            )}
          </Button>
        )}
      </div>
      
      {/* Question navigation pills */}
      <div className="mt-6 sm:mt-8 flex flex-wrap gap-2">
        {quiz.questions.map((question, idx) => (
          <button
            key={question.id}
            onClick={() => setCurrentQuestionIndex(idx)}
            className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-colors ${
              idx === currentQuestionIndex
                ? "bg-blue-600 text-white"
                : userAnswers[question.id]
                ? "bg-green-600/30 text-green-300 border border-green-500/30"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
} 
 