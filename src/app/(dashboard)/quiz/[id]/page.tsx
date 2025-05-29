"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSupabase } from "@/lib/supabase";
import { useUser } from "@clerk/nextjs";
import { Pencil, Trash2, Share2, Play, Plus, Copy, Facebook, Mail } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

interface Question {
  id: string;
  question: string;
  options: {
    id: string;
    option_text: string;
    is_correct: boolean;
  }[];
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  created_at: string;
  is_public: boolean;
  join_code?: string;
  questions: Question[];
  submission_count?: number;
}

export default function QuizDetailsPage() {
  const params = useParams();
  const quizId = params.id as string;
  const router = useRouter();
  const supabase = useSupabase();
  const { user } = useUser();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [submissionCountLoading, setSubmissionCountLoading] = useState(true);
  
  useEffect(() => {
    async function loadQuizData() {
      if (!quizId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        console.log(`[Quiz Details] Loading quiz ${quizId}`);
        
        // Use our API endpoint instead of direct Supabase queries
        const response = await fetch("/api/quiz/fetch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ quizId }),
        });
        
        console.log(`[Quiz Details] API response status: ${response.status}`);
        
        const data = await response.json();
        console.log(`[Quiz Details] Response data:`, data);
        
        if (!response.ok) {
          console.error('[Quiz Details] Error fetching quiz:', data);
          
          if (response.status === 403) {
            setError('You do not have permission to access this quiz');
          } else {
            setError(data.error || 'Failed to load quiz');
          }
          
          setIsLoading(false);
          return;
        }
        
        if (!data.success || !data.quiz) {
          console.error('[Quiz Details] Invalid response format:', data);
          setError('Invalid response from server');
          setIsLoading(false);
          return;
        }
        
        console.log(`[Quiz Details] Quiz loaded successfully with ${data.quiz.questions?.length || 0} questions`);
        
        // Set the quiz data
        setQuiz(data.quiz);
        
      } catch (error) {
        console.error('Error in loadQuizData:', error);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadQuizData();
  }, [quizId, supabase, user]);
  
  // Fetch submission count with the simplified endpoint
  useEffect(() => {
    // Only run this effect when quiz is loaded and has an ID
    if (typeof quiz?.id !== 'string') return;
    
    const quizId = quiz.id;
    
    async function fetchSubmissionCount() {
      if (!quiz?.id) return;
      
      setSubmissionCountLoading(true);
      
      try {
        const response = await fetch('/api/quiz/simple-count', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ quizId: quiz.id }),
        });
        
        if (!response.ok) return;
        
        const data = await response.json();
        
        if (data.success) {
          setQuiz(prevQuiz => {
            if (!prevQuiz) return null;
            return {
              ...prevQuiz,
              submission_count: data.count
            };
          });
        }
      } catch (error) {
        console.error('Error fetching submission count:', error);
      } finally {
        setSubmissionCountLoading(false);
      }
    }
    
    fetchSubmissionCount();
  }, [quiz?.id]);
  
  const handleDeleteQuiz = async () => {
    if (!quiz || !user) return;
    
    const confirmed = window.confirm("Are you sure you want to delete this quiz? This action cannot be undone.");
    if (!confirmed) return;
    
    setIsDeleting(true);
    
    try {
      // Delete options first (due to foreign key constraints)
      for (const question of quiz.questions) {
        await supabase
          .from('options')
          .delete()
          .eq('question_id', question.id);
      }
      
      // Delete questions
      await supabase
        .from('questions')
        .delete()
        .eq('quiz_id', quizId);
      
      // Delete quiz
      const { error: deleteError } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);
      
      if (deleteError) {
        throw new Error(deleteError.message);
      }
      
      toast.success('Quiz deleted successfully');
      router.push('/dashboard');
      
    } catch (error) {
      console.error('Error deleting quiz:', error);
      setError('Failed to delete quiz');
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success(message))
      .catch(() => toast.error('Failed to copy to clipboard'));
  };

  const getShareUrl = () => {
    return `${window.location.origin}/quiz/take/${quizId}`;
  };

  // Social sharing functions
  const shareViaWhatsApp = () => {
    const url = getShareUrl();
    const text = `Join my quiz "${quiz?.title}" 🧠`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`, "_blank");
  };

  const shareViaEmail = () => {
    const url = getShareUrl();
    const subject = encodeURIComponent(`Join my quiz: ${quiz?.title}`);
    const body = encodeURIComponent(`Hi,\n\nI have created a quiz and I would like you to take it. Click the link below to start:\n\n${url}\n\nEnjoy!`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const shareViaFacebook = () => {
    const url = getShareUrl();
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!quiz) {
    return (
      <div className="p-6 bg-gray-900 border border-blue-500/30 rounded-md text-center">
        <h2 className="text-xl font-bold text-white mb-2">Quiz not found</h2>
        <p className="text-blue-200 mb-4">The quiz you are looking for does not exist or you do not have permission to view it.</p>
        <Link href="/dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-md bg-red-900/30 border border-red-500/30 text-red-300">
          {error}
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-white break-words line-clamp-2">{quiz.title}</h1>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Link href={`/quiz/take/${quizId}`} className="flex-1 sm:flex-none">
            <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
            <Play className="h-4 w-4 mr-2" />
            Start Quiz
          </Button>
          </Link>
          <div className="relative flex-1 sm:flex-none">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-blue-500/30 hover:bg-gray-800"
              onClick={() => setShowShareMenu(!showShareMenu)}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            {showShareMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-gray-900 border border-blue-500/30 z-50">
                <div className="py-1 divide-y divide-gray-700">
                  <div className="px-4 py-3">
                    <p className="text-sm text-gray-400">Share via</p>
                    <div className="flex mt-2 gap-2">
                      <Button 
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 flex-1"
                        onClick={shareViaWhatsApp}
                      >
                        <WhatsAppIcon className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 flex-1"
                        onClick={shareViaEmail}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm"
                        className="bg-blue-800 hover:bg-blue-900 flex-1"
                        onClick={shareViaFacebook}
                      >
                        <Facebook className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-sm text-gray-400">Copy link</p>
                    <div className="flex mt-2 gap-2">
                      <input
                        type="text"
                        readOnly
                        value={getShareUrl()}
                        className="px-2 py-1 rounded text-sm bg-gray-800 text-white flex-1 border-none"
                      />
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(getShareUrl(), 'Link copied!')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <Link href={`/quiz/${quizId}/edit`} className="flex-1 sm:flex-none">
            <Button variant="outline" className="w-full sm:w-auto border-blue-500/30 hover:bg-blue-900/20">
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button 
            variant="outline" 
            className="border-red-500/30 hover:bg-red-900/20 text-red-400 hover:text-red-300"
            onClick={handleDeleteQuiz}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></div>
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
          <Card className="bg-gray-900 border-blue-500/30">
            <CardHeader>
              <CardTitle className="text-white">Quiz Details</CardTitle>
            <CardDescription className="text-blue-200 break-words">
                {quiz.description || "No description provided"}
              </CardDescription>
            </CardHeader>
            <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-800 p-3 rounded-md">
                  <span className="text-gray-400">Created</span>
                  <div className="text-white">{new Date(quiz.created_at).toLocaleDateString()}</div>
                </div>
                <div className="bg-gray-800 p-3 rounded-md">
                  <span className="text-gray-400">Visibility</span>
                  <div className="text-white flex items-center">
                    <div className={`h-2 w-2 rounded-full mr-2 ${quiz.is_public ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    {quiz.is_public ? 'Public' : 'Private'}
                  </div>
                </div>
                <div className="bg-gray-800 p-3 rounded-md">
                  <span className="text-gray-400">Questions</span>
                  <div className="text-white">{quiz.questions.length}</div>
                </div>
              <div className="bg-gray-800 p-3 rounded-md">
                <span className="text-gray-400">Submissions</span>
                <div className="text-white">
                  {submissionCountLoading ? (
                    <div className="h-5 w-5 animate-pulse bg-gray-700 rounded"></div>
                  ) : (
                    quiz.submission_count || 0
                  )}
                </div>
              </div>
                {quiz.join_code && (
                  <div className="bg-gray-800 p-3 rounded-md">
                    <span className="text-gray-400">Join Code</span>
                    <div className="flex items-center gap-1">
                      <div className="text-blue-300 font-mono">{quiz.join_code}</div>
                      <button 
                        onClick={() => copyToClipboard(quiz.join_code!, 'Code copied!')}
                        className="text-gray-400 hover:text-blue-400"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        
        <Card className="bg-gray-900 border-blue-500/30 flex flex-col">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow">
            <Link href={`/quiz/take/${quizId}`} className="w-full">
              <Button className="w-full bg-green-600 hover:bg-green-700 justify-start">
                <Play className="h-4 w-4 mr-2" />
                Take Quiz
              </Button>
            </Link>
              <Link href={`/quiz/${quizId}/edit`} className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Questions
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => copyToClipboard(getShareUrl(), 'Link copied!')}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </CardContent>
          </Card>
      </div>
      
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-xl font-bold text-white">Questions</h2>
          <Link href={`/quiz/${quizId}/edit`}>
            <Button className="text-sm bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </Link>
        </div>
        
        {quiz.questions.length > 0 ? (
          <div className="space-y-4">
            {quiz.questions.map((question, index) => (
              <Card key={question.id} className="bg-gray-900 border-blue-500/30">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 w-full overflow-hidden">
                      <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3 text-sm flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="break-words line-clamp-2">{question.question}</span>
                    </div>
                    <Link href={`/quiz/${quizId}/edit`} className="flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Pencil className="h-4 w-4 text-blue-400" />
                      </Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {question.options.map((option, optIndex) => (
                      <div 
                        key={option.id}
                        className={`p-3 rounded-md ${
                          option.is_correct 
                            ? 'bg-green-900/20 border border-green-500/30 text-green-300' 
                            : 'bg-gray-800 text-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="rounded-full bg-gray-700 h-6 w-6 flex items-center justify-center text-xs flex-shrink-0">
                            {String.fromCharCode(65 + optIndex)}
                          </span>
                          <span className="break-words">{option.option_text}</span>
                          {option.is_correct && (
                            <span className="ml-auto text-xs font-medium bg-green-800 px-2 py-1 rounded-full text-green-200 flex-shrink-0">
                              Correct
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-gray-900 border-blue-500/30">
            <CardContent className="py-6 text-center">
              <p className="text-gray-400 mb-4">No questions found in this quiz</p>
              <Link href={`/quiz/${quizId}/edit`}>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 