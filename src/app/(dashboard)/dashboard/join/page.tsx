'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "@/lib/motion";

export default function JoinQuizPage() {
  const publicQuizzes = [
    // In a real implementation, these would be fetched from Supabase
    { id: '1', title: 'Entertainment Quiz', creator: 'John Doe', questions: 10, participants: 25 },
    { id: '2', title: 'Science Trivia', creator: 'Jane Smith', questions: 15, participants: 42 },
    { id: '3', title: '90s Pop Culture', creator: 'Mike Johnson', questions: 12, participants: 18 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Join a Quiz</h1>
      </div>
      
      <Tabs defaultValue="code" className="w-full">
        <TabsList>
          <TabsTrigger value="code">Enter Quiz Code</TabsTrigger>
          <TabsTrigger value="public">Browse Public Quizzes</TabsTrigger>
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
                  <div className="flex gap-3">
                    <Input 
                      placeholder="Enter quiz code (e.g., QUIZ-123)"
                      className="flex-1"
                    />
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Join
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="public" className="pt-4">
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
            {publicQuizzes.map((quiz) => (
              <motion.div
                key={quiz.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 }
                }}
              >
                <Card className="hover:border-blue-500 transition-all cursor-pointer">
                  <CardHeader>
                    <CardTitle>{quiz.title}</CardTitle>
                    <CardDescription>Created by {quiz.creator}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm text-blue-200">
                      <span>{quiz.questions} questions</span>
                      <span>{quiz.participants} participants</span>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-4">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Join Quiz
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 