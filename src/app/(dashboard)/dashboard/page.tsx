'use client';

import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { motion } from "@/lib/motion";
import { useState, useEffect } from "react";
import { useSupabase } from "@/lib/supabase";
import { useUser } from "@clerk/nextjs";

interface Quiz {
  id: string;
  title: string;
  description: string;
  questionCount: number;
}

interface RecentQuiz {
  id: string;
  title: string;
  creator: string;
  completedAt: string;
  score: string;
}

export default function DashboardPage() {
  const [myQuizzes, setMyQuizzes] = useState<Quiz[]>([]);
  const [recentQuizzes] = useState<RecentQuiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useSupabase();
  const { user } = useUser();
  
  useEffect(() => {
    async function loadQuizzes() {
      if (!user) return;
      
      try {
        // Fetch quiz basic info
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('id, title, description')
          .eq('created_by', user.id);
        
        if (quizError) {
          console.error('Error loading quizzes:', quizError);
          return;
        }
        
        if (quizData) {
          // Fetch question counts for each quiz
          const quizzesWithCounts = await Promise.all(quizData.map(async (quiz) => {
            const { count, error: countError } = await supabase
              .from('questions')
              .select('*', { count: 'exact', head: true })
              .eq('quiz_id', quiz.id);
              
            if (countError) {
              console.error('Error getting question count:', countError);
              return {
                id: quiz.id,
                title: quiz.title,
                description: quiz.description || '',
                questionCount: 0
              };
            }
            
            return {
              id: quiz.id,
              title: quiz.title,
              description: quiz.description || '',
              questionCount: count || 0
            };
          }));
          
          setMyQuizzes(quizzesWithCounts);
        }
      } catch (error) {
        console.error('Error fetching quizzes:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadQuizzes();
  }, [supabase, user]);
  
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <div className="flex gap-3">
          <Link href="/dashboard/create">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Create Quiz
            </Button>
          </Link>
          <Link href="/dashboard/join">
            <Button variant="outline" className="border-blue-500/30 hover:bg-gray-900 text-white">
              Join Quiz
            </Button>
          </Link>
        </div>
      </div>
      
      <Tabs defaultValue="my-quizzes" className="w-full">
        <TabsList className="bg-gray-900 border border-blue-500/30">
          <TabsTrigger value="my-quizzes" className="data-[state=active]:bg-gray-800 data-[state=active]:text-blue-300">My Quizzes</TabsTrigger>
          <TabsTrigger value="recent" className="data-[state=active]:bg-gray-800 data-[state=active]:text-blue-300">Recent Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-quizzes" className="pt-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : myQuizzes.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {myQuizzes.map((quiz) => (
                <motion.div key={quiz.id} variants={item}>
                  <Card className="bg-gray-900 border-blue-500/30 hover:border-blue-500 transition-all cursor-pointer overflow-hidden">
                    <CardHeader>
                      <CardTitle className="text-white">{quiz.title}</CardTitle>
                      <CardDescription className="text-blue-200">{quiz.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-between border-t border-blue-500/20 pt-4">
                      <span className="text-sm text-blue-200">{quiz.questionCount} questions</span>
                      <Link href={`/quiz/${quiz.id}`}>
                        <Button variant="ghost" className="text-blue-300 hover:text-blue-200 hover:bg-gray-800">
                          View Details
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
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
          {recentQuizzes.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {recentQuizzes.map((quiz) => (
                <motion.div key={quiz.id} variants={item}>
                  <Card className="bg-gray-900 border-blue-500/30 hover:border-blue-500 transition-all cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-white">{quiz.title}</CardTitle>
                      <CardDescription className="text-blue-200">By {quiz.creator}</CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-between border-t border-blue-500/20 pt-4">
                      <span className="text-sm text-blue-200">Completed {quiz.completedAt}</span>
                      <span className="text-sm font-medium text-blue-300">Score: {quiz.score}</span>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
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