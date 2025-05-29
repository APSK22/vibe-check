"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useSupabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Calendar, Award, Trash2, AlertCircle, Bug, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { motion, AnimatePresence } from "@/lib/motion";
import { format } from "date-fns";

interface QuizAttempt {
  id: string;
  quiz_id: string;
  completed_at: string;
  score: number;
  max_score: number;
  quiz_title: string;
  quiz_description: string;
  quiz_type: "scored" | "vibe";
  vibe_analysis?: string;
  vibe_categories?: Record<string, string>;
  user_answers?: Array<{
    question: string;
    selected_option: string;
    is_correct?: boolean;
  }>;
}

export default function MyAttemptsPage() {
  const { user } = useUser();
  const supabase = useSupabase();
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<{ [key: string]: unknown }>({});
  const [isRunningMigration, setIsRunningMigration] = useState(false);
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null);
  const [loadingAnswers, setLoadingAnswers] = useState<boolean>(false);
  
  useEffect(() => {
    async function fetchAttempts() {
      if (!user) return;
      
      setIsLoading(true);
      setError(null);
      const debugData: { [key: string]: unknown } = {};
      
      try {
        console.log("Fetching attempts for user:", user.id);
        
        // Use our admin API to fetch attempts
        const response = await fetch('/api/quiz/get-attempts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        debugData.apiResponse = {
          status: response.status,
          ok: response.ok
        };
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error from API:", errorData);
          setError(errorData.error || "Failed to load your quiz attempts");
          setDebug(debugData);
          setIsLoading(false);
          return;
        }
        
        const data = await response.json();
        
        debugData.attemptsFetched = data.attempts?.length || 0;
        
        if (!data.success || !data.attempts) {
          console.error("Invalid response format:", data);
          setError("Invalid response from server");
          setDebug(debugData);
          setIsLoading(false);
          return;
        }
        
        console.log("Attempts loaded successfully:", data.attempts.length);
        setAttempts(data.attempts);
      } catch (err) {
        console.error("Error in fetchAttempts:", err);
        setError("An unexpected error occurred while loading your attempts");
        debugData.unexpectedError = err instanceof Error ? err.message : String(err);
      } finally {
        setDebug(debugData);
        setIsLoading(false);
      }
    }
    
    fetchAttempts();
  }, [user]);
  
  const handleDeleteAttempt = async (attemptId: string) => {
    if (!confirm("Are you sure you want to delete this attempt? This cannot be undone.")) {
      return;
    }
    
    try {
      // Use our admin API to delete the attempt
      const response = await fetch('/api/quiz/delete-attempt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ attemptId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error deleting attempt:", errorData);
        toast.error("Failed to delete attempt");
        return;
      }
      
      // Remove from UI if successful
      setAttempts(attempts.filter(a => a.id !== attemptId));
      toast.success("Attempt deleted successfully");
    } catch (err) {
      console.error("Error in handleDeleteAttempt:", err);
      toast.error("Failed to delete attempt");
    }
  };
  
  // Add function to run migrations
  const handleRunMigrations = async () => {
    setIsRunningMigration(true);
    
    try {
      const response = await fetch('/api/debug/run-migrations', {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success("Database migrations completed. Reloading data...");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error("Failed to run migrations");
        console.error("Migration error:", result);
      }
    } catch (err) {
      console.error("Error running migrations:", err);
      toast.error("Failed to run migrations");
    } finally {
      setIsRunningMigration(false);
    }
  };
  
  // Toggle expanded view for an attempt
  const toggleExpandAttempt = async (attemptId: string) => {
    if (expandedAttemptId === attemptId) {
      // Collapse if already expanded
      setExpandedAttemptId(null);
    } else {
      // Expand this attempt
      setExpandedAttemptId(attemptId);
      
      // Load user answers if not already loaded
      const attempt = attempts.find(a => a.id === attemptId);
      if (attempt && !attempt.user_answers) {
        setLoadingAnswers(true);
        try {
          // Use our admin API to fetch answers
          const response = await fetch('/api/quiz/get-attempt-answers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              attemptId: attempt.id,
              quizId: attempt.quiz_id
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error("Error fetching answers:", errorData);
            return;
          }
          
          const data = await response.json();
          
          if (data.success && data.answers) {
            // Update the attempts array with the answers
            setAttempts(prevAttempts => 
              prevAttempts.map(a => 
                a.id === attemptId 
                  ? { ...a, user_answers: data.answers } 
                  : a
              )
            );
          }
        } catch (err) {
          console.error("Error loading answers:", err);
        } finally {
          setLoadingAnswers(false);
        }
      }
    }
  };

  // Render the detailed view for an attempt
  const renderDetailedView = (attempt: QuizAttempt) => {
    return (
      <AnimatePresence>
        {expandedAttemptId === attempt.id && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-700 mt-2 pt-4 space-y-4">
              {loadingAnswers ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : attempt.quiz_type === 'vibe' ? (
                // Vibe check detailed view
                <div className="space-y-4">
                  <div>
                    <h4 className="text-base font-medium text-white mb-1">Your Vibe Analysis</h4>
                    <p className="text-gray-300 text-sm">
                      {attempt.vibe_analysis || "No vibe analysis available"}
                    </p>
                  </div>
                  
                  {attempt.vibe_categories && Object.keys(attempt.vibe_categories).length > 0 && (
                    <div>
                      <h4 className="text-base font-medium text-white mb-2">Vibe Categories</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(attempt.vibe_categories).map(([category, value]) => (
                          <div key={category} className="bg-purple-900/20 border border-purple-500/20 rounded-md p-2">
                            <span className="block text-xs text-gray-400">{category}</span>
                            <span className="text-sm text-purple-300">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Scored quiz detailed view
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-medium text-white">Your Score</h4>
                    <div className="bg-blue-900/30 border border-blue-500/30 rounded-full px-3 py-1">
                      <span className="text-blue-300 font-medium">
                        {attempt.score} / {attempt.max_score} ({Math.round((attempt.score / attempt.max_score) * 100)}%)
                      </span>
                    </div>
                  </div>
                  
                  {attempt.user_answers && attempt.user_answers.length > 0 ? (
                    <div>
                      <h4 className="text-base font-medium text-white mb-2">Your Answers</h4>
                      <div className="space-y-3">
                        {attempt.user_answers.map((answer, idx) => (
                          <div 
                            key={idx} 
                            className={`p-3 rounded-md ${
                              answer.is_correct === true ? 'bg-green-900/20 border border-green-500/30' : 
                              answer.is_correct === false ? 'bg-red-900/20 border border-red-500/30' :
                              'bg-gray-800 border border-gray-700'
                            }`}
                          >
                            <p className="text-sm font-medium text-white mb-1">{answer.question}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">Your answer:</span>
                              <span className="text-xs text-gray-300">{answer.selected_option}</span>
                              {answer.is_correct !== undefined && (
                                <span className={`text-xs ml-auto ${answer.is_correct ? 'text-green-400' : 'text-red-400'}`}>
                                  {answer.is_correct ? 'Correct' : 'Incorrect'}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Detailed answers are not available for this attempt.</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-white">My Attempts</h1>
        <Card className="bg-gray-900 border-red-500/30">
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <div className="rounded-full bg-red-900/30 p-3 mb-4">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Error Loading Attempts</h3>
            <p className="text-gray-400 mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
                Try Again
              </Button>
              <Button 
                onClick={handleRunMigrations} 
                disabled={isRunningMigration}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                {isRunningMigration ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                    Running Migrations...
                  </>
                ) : (
                  "Run Database Setup"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 border-yellow-500/30 p-4">
          <h3 className="font-bold text-white mb-2">Troubleshooting</h3>
          <p className="text-sm text-gray-400 mb-2">If you&apos;re seeing this error, try these steps:</p>
          <ul className="list-disc pl-5 text-sm text-gray-400 space-y-1">
            <li>Make sure you&apos;ve run the latest database migrations</li>
            <li>Check if all the required tables exist (quiz_submissions, vibe_results)</li>
            <li>Verify that you&apos;ve attempted at least one quiz</li>
          </ul>
        </Card>
        
        {/* Debug info */}
        <details className="mt-8 text-sm text-gray-400">
          <summary className="flex items-center gap-2 cursor-pointer">
            <Bug className="h-4 w-4" /> Debug Information
          </summary>
          <pre className="mt-2 p-4 bg-gray-900 rounded-md overflow-auto">
            {JSON.stringify(debug, null, 2)}
          </pre>
        </details>
      </div>
    );
  }
  
  if (attempts.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-white">My Attempts</h1>
        <Card className="bg-gray-900 border-blue-500/30">
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <div className="rounded-full bg-gray-800 p-3 mb-4">
              <Award className="h-8 w-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Attempts Yet</h3>
            <p className="text-gray-400 mb-6">You haven&apos;t attempted any quizzes yet.</p>
            <Link href="/dashboard/join">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Find a Quiz to Take
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        {/* Debug info */}
        <details className="mt-8 text-sm text-gray-400">
          <summary className="flex items-center gap-2 cursor-pointer">
            <Bug className="h-4 w-4" /> Debug Information
          </summary>
          <pre className="mt-2 p-4 bg-gray-900 rounded-md overflow-auto">
            {JSON.stringify(debug, null, 2)}
          </pre>
        </details>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-white">My Attempts</h1>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {attempts.map((attempt, index) => (
          <motion.div
            key={attempt.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          >
            <Card className={`h-full flex flex-col ${attempt.quiz_type === 'vibe' ? 'border-purple-500/30 bg-gradient-to-br from-gray-900 to-purple-900/20' : 'border-blue-500/30 bg-gray-900'}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {attempt.quiz_type === 'vibe' && (
                        <Sparkles className="h-4 w-4 text-purple-400" />
                      )}
                      <span className="line-clamp-1">{attempt.quiz_title}</span>
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {attempt.quiz_description}
                    </CardDescription>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteAttempt(attempt.id);
                    }}
                    className="text-gray-400 hover:text-red-400 transition-colors p-1"
                    title="Delete attempt"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="py-2 flex-grow">
                <div className="flex items-center text-xs text-gray-400 gap-2 mb-2">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {attempt.completed_at ? format(new Date(attempt.completed_at), "MMM d, yyyy - h:mm a") : "Unknown date"}
                  </span>
                </div>

                {attempt.quiz_type === 'vibe' ? (
                  <div className="mt-2">
                    {attempt.vibe_analysis ? (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-300 line-clamp-3">{attempt.vibe_analysis}</p>
                        {attempt.vibe_categories && (
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(attempt.vibe_categories).slice(0, 3).map(([category, value]) => (
                              <div key={category} className="px-2 py-0.5 bg-purple-900/30 border border-purple-500/20 rounded-full text-xs text-purple-300">
                                {value}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Vibe analysis unavailable</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center mt-2">
                    <Award className="h-5 w-5 text-yellow-500 mr-2" />
                    <span className="text-white font-medium">
                      {attempt.score}/{attempt.max_score}
                      {" "}
                      ({Math.round((attempt.score / attempt.max_score) * 100)}%)
                    </span>
                  </div>
                )}
                
                {/* Detailed View Section */}
                {renderDetailedView(attempt)}
              </CardContent>
              <CardFooter className="pt-2">
                <Button 
                  variant="outline"
                  className="w-full flex justify-between items-center"
                  onClick={() => toggleExpandAttempt(attempt.id)}
                >
                  <span>{expandedAttemptId === attempt.id ? "Hide Details" : "View Details"}</span>
                  {expandedAttemptId === attempt.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </motion.div>
      
      {/* Debug info */}
      <details className="mt-8 text-sm text-gray-400">
        <summary className="flex items-center gap-2 cursor-pointer">
          <Bug className="h-4 w-4" /> Debug Information
        </summary>
        <pre className="mt-2 p-4 bg-gray-900 rounded-md overflow-auto">
          {JSON.stringify(debug, null, 2)}
        </pre>
      </details>
    </div>
  );
} 