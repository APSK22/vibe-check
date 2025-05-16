"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSupabase } from "@/lib/supabase";
import { useUser } from "@clerk/nextjs";
import { ArrowLeft, ArrowRight, Check, Clock, Award, AlertCircle } from "lucide-react";
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
  questions: Question[];
}

export default function TakeQuizPage() {
  const params = useParams();
  const quizId = params.id as string;
  const supabase = useSupabase();
  const { user } = useUser();
  
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
  
  // Load quiz data
  useEffect(() => {
    async function loadQuizData() {
      if (!quizId) return;
      
      try {
        // Load quiz details
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .single();
        
        if (quizError) {
          console.error('Error loading quiz:', quizError);
          setError('Failed to load quiz');
          return;
        }
        
        // Load questions
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('quiz_id', quizId)
          .order('order_num');
        
        if (questionsError) {
          console.error('Error loading questions:', questionsError);
          setError('Failed to load questions');
          return;
        }
        
        // For each question, load its options
        const questionsWithOptions = await Promise.all(
          questionsData.map(async (q) => {
            const { data: optionsData, error: optionsError } = await supabase
              .from('options')
              .select('*')
              .eq('question_id', q.id)
              .order('order_num');
            
            if (optionsError) {
              console.error('Error loading options:', optionsError);
              return {
                ...q,
                options: []
              };
            }
            
            return {
              ...q,
              options: optionsData
            };
          })
        );
        
        // Combine quiz and questions
        setQuiz({
          ...quizData,
          questions: questionsWithOptions
        });
        
        // Initialize start time
        setStartTime(Date.now());
        
      } catch (error) {
        console.error('Error in loadQuizData:', error);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadQuizData();
  }, [quizId, supabase]);
  
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
      
      // Record submission in database
      const { data: submission, error: submissionError } = await supabase
        .from('quiz_submissions')
        .insert({
          quiz_id: quizId,
          user_id: user.id,
          score: finalScore.correct,
          max_score: finalScore.total
        })
        .select()
        .single();
      
      if (submissionError) {
        console.error('Error recording submission:', submissionError);
        throw new Error('Failed to record submission');
      }
      
      // Record user answers
      for (const questionId in userAnswers) {
        const optionId = userAnswers[questionId];
        const question = quiz.questions.find(q => q.id === questionId);
        const option = question?.options.find(o => o.id === optionId);
        
        await supabase.from('user_answers').insert({
          submission_id: submission.id,
          question_id: questionId,
          selected_option_id: optionId,
          is_correct: option?.is_correct || false
        });
      }
      
      setQuizCompleted(true);
      
      // Trigger confetti effect if score is good
      if (finalScore.correct / finalScore.total >= 0.7) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      
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
        <p className="text-blue-300">Loading quiz...</p>
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
    const percentage = Math.round((score.correct / score.total) * 100);
    
    return (
      <div className="max-w-3xl mx-auto p-4">
        <Card className="bg-gray-900 border-blue-500/30 overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500"></div>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl md:text-3xl text-white">Quiz Results</CardTitle>
            <CardDescription className="text-blue-200">
              You have completed &ldquo;{quiz.title}&rdquo;
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-8">
            <div className="text-center py-6">
              <div className="relative inline-flex">
                <Award className="h-24 w-24 text-yellow-500" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-2xl font-bold text-white">{percentage}%</div>
                </div>
              </div>
              
              <div className="mt-4 space-y-1">
                <h3 className="text-xl font-semibold text-white">
                  {
                    percentage >= 80 ? "Excellent!" :
                    percentage >= 60 ? "Good job!" :
                    percentage >= 40 ? "Nice try!" :
                    "Keep practicing!"
                  }
                </h3>
                <p className="text-blue-200">You scored {score.correct} out of {score.total}</p>
                <p className="text-gray-400">Time: {formatTime(timeSpent)}</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-white border-b border-gray-800 pb-2">Question Review</h3>
              
              {quiz.questions.map((question, index) => {
                const userSelectedOptionId = userAnswers[question.id];
                const userSelectedOption = question.options.find(o => o.id === userSelectedOptionId);
                const correctOption = question.options.find(o => o.is_correct);
                const isCorrect = userSelectedOptionId === correctOption?.id;
                
                return (
                  <div key={question.id} className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 rounded-full p-1 ${isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {isCorrect ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white">
                          {index + 1}. {question.question}
                        </p>
                        <div className="mt-2 space-y-1 text-sm">
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
        <Link href={`/quiz/${quizId}`}>
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