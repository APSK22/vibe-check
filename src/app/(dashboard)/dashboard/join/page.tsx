"use client";

import { useState, useEffect } from "react";
import { useSupabase } from "@/lib/supabase";
import { useUser } from "@clerk/nextjs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "@/lib/motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, Trash2, Users, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Quiz {
  id: string;
  title: string;
  description: string;
  created_at: string;
  created_by: string;
  is_public: boolean;
  quiz_type: "scored" | "vibe";
  submission_count: number;
}

export default function JoinQuizPage() {
  const supabase = useSupabase();
  const { user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [publicQuizzes, setPublicQuizzes] = useState<Quiz[]>([]);
  const [myQuizzes, setMyQuizzes] = useState<Quiz[]>([]);
  const [quizCode, setQuizCode] = useState("");
  
  useEffect(() => {
    async function fetchQuizzes() {
      if (!user) return;
      
      setIsLoading(true);
      
      try {
        // Fetch public quizzes
        const { data: publicData, error: publicError } = await supabase
          .from("quizzes")
          .select(`
            id, 
            title, 
            description, 
            created_at, 
            created_by,
            is_public,
            quiz_type
          `)
          .eq("is_public", true)
          .order("created_at", { ascending: false });
          
        if (publicError) {
          console.error("Error fetching public quizzes:", publicError);
          toast.error("Failed to load public quizzes");
        } else {
          // Get submission count using our API endpoint
          const publicQuizzesWithMetadata = await Promise.all((publicData || []).map(async (quiz) => {
            let submissionCount = 0;
            
            try {
              const response = await fetch('/api/quiz/simple-count', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ quizId: quiz.id }),
              });
              
              if (response.ok) {
                const data = await response.json();
                if (data.success) {
                  submissionCount = data.count;
                }
              }
            } catch (countError) {
              console.error(`[Join Quiz] Error counting submissions for quiz ${quiz.id}:`, countError);
            }
              
            return {
              ...quiz,
              submission_count: submissionCount
            };
          }));
          
          setPublicQuizzes(publicQuizzesWithMetadata);
        }
        
        // Fetch user's own quizzes
        const { data: myData, error: myError } = await supabase
          .from("quizzes")
          .select(`
            id, 
            title, 
            description, 
            created_at, 
            created_by,
            is_public,
            quiz_type
          `)
          .eq("created_by", user.id)
          .order("created_at", { ascending: false });
          
        if (myError) {
          console.error("Error fetching user's quizzes:", myError);
        } else {
          // Get submission count for each quiz using our API endpoint
          const myQuizzesWithMetadata = await Promise.all((myData || []).map(async (quiz) => {
            let submissionCount = 0;
            
            try {
              const response = await fetch('/api/quiz/simple-count', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ quizId: quiz.id }),
              });
              
              if (response.ok) {
                const data = await response.json();
                if (data.success) {
                  submissionCount = data.count;
                }
              }
            } catch (countError) {
              console.error(`[Join Quiz] Error counting submissions for quiz ${quiz.id}:`, countError);
            }
            
            return {
              ...quiz,
              submission_count: submissionCount
            };
          }));
          
          setMyQuizzes(myQuizzesWithMetadata);
        }
      } catch (error) {
        console.error("Error in fetchQuizzes:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchQuizzes();
  }, [user, supabase]);
  
  const handleJoinByCode = async () => {
    if (!quizCode.trim()) {
      toast.error("Please enter a quiz code");
      return;
    }
    
    try {
      // Use our access API to check if the quiz exists and verify it
      const response = await fetch("/api/quiz/access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quizId: quizCode }),
      });
      
      if (!response.ok) {
        toast.error("Invalid or expired quiz code");
        return;
      }
      
      const data = await response.json();
      
      if (!data.success || !data.quiz) {
        toast.error("Invalid or expired quiz code");
        return;
      }
      
      // Success - navigate to the quiz
      router.push(`/quiz/take/${quizCode}`);
    } catch (error) {
      console.error("Error joining quiz by code:", error);
      toast.error("Failed to join quiz");
    }
  };
  
  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm("Are you sure you want to delete this quiz? This cannot be undone.")) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from("quizzes")
        .delete()
        .eq("id", quizId);
        
      if (error) {
        console.error("Error deleting quiz:", error);
        toast.error("Failed to delete quiz");
        return;
      }
      
      toast.success("Quiz deleted successfully");
      setMyQuizzes(myQuizzes.filter(quiz => quiz.id !== quizId));
    } catch (error) {
      console.error("Error in handleDeleteQuiz:", error);
      toast.error("Failed to delete quiz");
    }
  };
  
  // Render quiz card
  const renderQuizCard = (quiz: Quiz, showDelete = false) => (
    <motion.div
      key={quiz.id}
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
    >
      <Card className={`h-full flex flex-col hover:border-blue-500/50 transition-all ${quiz.quiz_type === 'vibe' ? 'border-purple-500/30' : 'border-blue-500/30'}`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2">
                {quiz.quiz_type === 'vibe' && (
                  <Sparkles className="h-4 w-4 flex-shrink-0 text-purple-400" />
                )}
                <span className="line-clamp-1 break-words">{quiz.title}</span>
              </CardTitle>
              {showDelete && (
                <CardDescription>
                  <span>Your quiz</span>
                </CardDescription>
              )}
            </div>
            {showDelete && (
              <button
                onClick={() => handleDeleteQuiz(quiz.id)}
                className="text-gray-400 hover:text-red-400 transition-colors p-1 ml-2"
                title="Delete quiz"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="py-2 flex-grow">
          <p className="text-gray-300 line-clamp-2 text-sm mb-3 break-words">
            {quiz.description || `A ${quiz.quiz_type === 'vibe' ? 'vibe check' : 'quiz'}`}
          </p>
          <div className="flex flex-wrap justify-between text-xs text-gray-400 gap-y-2">
            <div className="flex items-center gap-1">
              <Users size={12} className="flex-shrink-0" />
              <span>{quiz.submission_count !== undefined ? `${quiz.submission_count} attempts` : "..."}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={12} className="flex-shrink-0" />
              <span>{format(new Date(quiz.created_at), "MMM d, yyyy")}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <Link href={`/quiz/take/${quiz.id}`} className="w-full">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-sm">
              {quiz.quiz_type === 'vibe' ? 'Take Vibe Check' : 'Take Quiz'}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Join a Quiz</h1>
      </div>
      
      <Tabs defaultValue="code" className="w-full">
        <TabsList className="w-full flex">
          <TabsTrigger value="code" className="flex-1">Enter Quiz Code</TabsTrigger>
          <TabsTrigger value="public" className="flex-1">Public Quizzes</TabsTrigger>
          <TabsTrigger value="my" className="flex-1">My Quizzes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="code" className="pt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Enter Quiz Code</CardTitle>
                <CardDescription>
                  Have a quiz code? Enter it below to join a quiz
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input 
                      placeholder="Enter quiz ID"
                      className="flex-1"
                      value={quizCode}
                      onChange={(e) => setQuizCode(e.target.value)}
                    />
                    <Button 
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                      onClick={handleJoinByCode}
                    >
                      Join
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="public" className="pt-4">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : publicQuizzes.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-400">No public quizzes available at the moment.</p>
            </div>
          ) : (
          <motion.div
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
              {publicQuizzes.map(quiz => renderQuizCard(quiz))}
            </motion.div>
          )}
        </TabsContent>
        
        <TabsContent value="my" className="pt-4">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : myQuizzes.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-400">You haven&apos;t created any quizzes yet.</p>
              <Link href="/dashboard/create">
                <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                  Create Your First Quiz
                </Button>
              </Link>
            </div>
          ) : (
              <motion.div
                variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {myQuizzes.map(quiz => renderQuizCard(quiz, true))}
              </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 