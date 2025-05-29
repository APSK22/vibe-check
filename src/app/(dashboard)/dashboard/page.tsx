'use client';

import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { motion } from "@/lib/motion";
import { useState, useEffect } from "react";
import { useSupabase } from "@/lib/supabase";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { Sparkles, Trash2, Award, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Quiz {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  submissionCount?: number;
  quiz_type?: "scored" | "vibe";
  created_at: string;
}

interface RecentAttempt {
  id: string;
  quiz_id: string;
  completed_at: string;
  score: number;
  max_score: number;
  quiz_title: string;
  quiz_description: string;
  quiz_type: "scored" | "vibe";
  vibe_analysis?: string;
}

export default function DashboardPage() {
  const [myQuizzes, setMyQuizzes] = useState<Quiz[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useSupabase();
  const { user } = useUser();
  
  useEffect(() => {
    async function fetchQuizzes() {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Fetch user's created quizzes using our new API endpoint
        console.log('[Dashboard] Fetching user quizzes from API');
        const quizResponse = await fetch('/api/quiz/user-quizzes');
        
        if (!quizResponse.ok) {
          const errorData = await quizResponse.json();
          console.error('[Dashboard] Error fetching quizzes:', errorData);
          toast.error('Failed to load your quizzes');
          return;
        }
        
        const quizData = await quizResponse.json();
        console.log('[Dashboard] Quizzes loaded:', quizData.quizzes?.length || 0);
        
        if (quizData.success && Array.isArray(quizData.quizzes)) {
          setMyQuizzes(quizData.quizzes);
        } else {
          setMyQuizzes([]);
        }
        
        // Fetch user's recent quiz attempts - using the same logic as attempts page
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('quiz_submissions')
          .select(`
            id,
            quiz_id,
            completed_at,
            score,
            max_score,
            user_id
          `)
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(5);
        
        if (submissionsError) {
          console.error("Error fetching submissions:", submissionsError);
          return;
        }
        
        if (!submissionsData || submissionsData.length === 0) {
          console.log("No quiz submissions found");
          setRecentAttempts([]);
          return;
        }
        
        // Fetch quiz details for all quiz_ids in one go
        const quizIds = submissionsData.map(sub => sub.quiz_id);
        const { data: attemptQuizData, error: quizLookupError } = await supabase
          .from('quizzes')
          .select('id, title, description, quiz_type')
          .in('id', quizIds);
        
        if (quizLookupError) {
          console.error("Error fetching quiz details:", quizLookupError);
        }
        
        // Create a map of quiz details for efficient lookup
        const quizMap = new Map();
        if (attemptQuizData) {
          attemptQuizData.forEach(quiz => {
            quizMap.set(quiz.id, quiz);
          });
            }
            
        // Fetch vibe results for vibe-type quizzes
        const submissionIds = submissionsData.map(sub => sub.id);
        const { data: vibeData, error: vibeError } = await supabase
          .from('vibe_results')
          .select('submission_id, vibe_analysis')
          .in('submission_id', submissionIds);
        
        if (vibeError) {
          console.log("Error fetching vibe results:", vibeError);
        }
        
        // Create a map of vibe results for efficient lookup
        const vibeMap = new Map();
        if (vibeData) {
          vibeData.forEach(vibe => {
            vibeMap.set(vibe.submission_id, vibe);
          });
        }
        
        // Combine all the data
        const combinedAttempts = submissionsData.map(submission => {
          const quiz = quizMap.get(submission.quiz_id) || { 
            title: "Unknown Quiz", 
            description: "", 
            quiz_type: "scored" 
          };
          
          const vibe = vibeMap.get(submission.id);
          
          return {
            id: submission.id,
            quiz_id: submission.quiz_id,
            completed_at: submission.completed_at,
            score: submission.score,
            max_score: submission.max_score,
            quiz_title: quiz.title,
            quiz_description: quiz.description,
            quiz_type: quiz.quiz_type || "scored",
            vibe_analysis: vibe?.vibe_analysis
            };
        });
          
        console.log("Recent attempts:", combinedAttempts);
        setRecentAttempts(combinedAttempts);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchQuizzes();
  }, [user, supabase]);

  const handleDeleteQuiz = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this quiz? This cannot be undone.")) {
      return;
    }
    
    try {
      // Use our API endpoint to delete the quiz
      const response = await fetch("/api/quiz/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quizId: id }),
      });
      
      const data = await response.json();
        
      if (!response.ok) {
        console.error("[Dashboard] Error deleting quiz:", data);
        toast.error(data.error || "Failed to delete quiz");
        return;
      }
      
      toast.success("Quiz deleted successfully");
      setMyQuizzes(myQuizzes.filter(quiz => quiz.id !== id));
    } catch (error) {
      console.error("Error in handleDeleteQuiz:", error);
      toast.error("Failed to delete quiz");
    }
  };
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard</h1>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Link href="/dashboard/create" className="flex-1 sm:flex-auto">
            <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">Create Quiz</Button>
          </Link>
          <Link href="/dashboard/join" className="flex-1 sm:flex-auto">
            <Button variant="outline" className="w-full sm:w-auto">Join Quiz</Button>
          </Link>
        </div>
      </div>
      
      <Tabs defaultValue="myQuizzes" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="myQuizzes" className="flex-1">My Created Quizzes</TabsTrigger>
          <TabsTrigger value="recent" className="flex-1">Recent Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="myQuizzes" className="pt-4">
          {myQuizzes.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {myQuizzes.map((quiz) => (
                <motion.div key={quiz.id} variants={item}>
                  <Link href={`/quiz/${quiz.id}`} className="block h-full">
                    <Card className={`h-full bg-gray-900 hover:border-blue-500 transition-all cursor-pointer overflow-hidden ${quiz.quiz_type === 'vibe' ? 'border-purple-500/30' : 'border-blue-500/30'}`}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2 text-white">
                              {quiz.quiz_type === 'vibe' && (
                                <Sparkles className="h-4 w-4 flex-shrink-0 text-purple-400" />
                              )}
                              <span className="line-clamp-1 break-words">{quiz.title}</span>
                            </CardTitle>
                      <CardDescription className="text-blue-200 line-clamp-2 break-words">{quiz.description}</CardDescription>
                          </div>
                          <button
                            onClick={(e) => handleDeleteQuiz(quiz.id, e)}
                            className="text-gray-400 hover:text-red-400 transition-colors p-1"
                            title="Delete quiz"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                    </CardHeader>
                    <CardFooter className="flex flex-col xs:flex-row justify-between gap-2 border-t border-blue-500/20 pt-4">
                      <div className="flex gap-3 text-sm text-blue-200 flex-wrap">
                        <span>{quiz.questionCount} questions</span>
                        <span className="hidden xs:inline">•</span>
                        <span>{quiz.submissionCount ?? '–'} attempts</span>
                      </div>
                      <Button variant="ghost" className="text-blue-300 hover:text-blue-200 hover:bg-gray-800 w-full xs:w-auto">
                          View Details
                        </Button>
                    </CardFooter>
                  </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <Card className="bg-gray-900 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-xl text-center text-white">No quizzes yet</CardTitle>
                <CardDescription className="text-center text-blue-200">
                  Create your first quiz to get started!
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-center pb-6">
                <Link href="/dashboard/create">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Create Quiz
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="recent" className="pt-4">
          <h2 className="text-lg font-medium text-white mb-4">Recent Attempts</h2>
          {recentAttempts.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {recentAttempts.map((attempt) => (
                <motion.div key={attempt.id} variants={item}>
                  <Link href={`/dashboard/attempts`}>
                    <Card className={`h-full bg-gray-900 hover:border-blue-500 transition-all cursor-pointer ${attempt.quiz_type === 'vibe' ? 'border-purple-500/30' : 'border-blue-500/30'}`}>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-white">
                          {attempt.quiz_type === 'vibe' && (
                            <Sparkles className="h-4 w-4 text-purple-400" />
                          )}
                          <span className="line-clamp-1">{attempt.quiz_title}</span>
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {attempt.quiz_description}
                        </CardDescription>
                    </CardHeader>
                      <CardFooter className="flex justify-between items-center border-t border-blue-500/20 pt-3">
                        <div className="flex items-center gap-1 text-sm text-blue-200">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {format(new Date(attempt.completed_at), "MMM d, yyyy")}
                          </span>
                        </div>
                        {attempt.quiz_type === 'scored' ? (
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-yellow-400" />
                            <span className="text-sm font-medium text-blue-300">
                              {attempt.score}/{attempt.max_score}
                            </span>
                          </div>
                        ) : (
                          <div className="bg-purple-900/20 px-2 py-1 rounded text-xs text-purple-300">
                            Vibe Check
                          </div>
                        )}
                    </CardFooter>
                  </Card>
                  </Link>
                </motion.div>
              ))}
              
              <motion.div variants={item}>
                <Link href="/dashboard/attempts">
                  <Card className="h-full flex flex-col items-center justify-center p-6 bg-gray-900 border-dashed border-gray-700 hover:border-blue-500 transition-all cursor-pointer">
                    <p className="text-blue-400 font-medium">View All Attempts</p>
                    <p className="text-xs text-gray-400 mt-1">See your complete history</p>
                  </Card>
                </Link>
              </motion.div>
            </motion.div>
          ) : (
            <Card className="bg-gray-900 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-xl text-center text-white">No recent activity</CardTitle>
                <CardDescription className="text-center text-blue-200">
                  Join a quiz to see your recent activity!
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-center pb-6">
                <Link href="/dashboard/join">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Join Quiz
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 