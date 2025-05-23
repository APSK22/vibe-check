"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "@/lib/motion";
import { Sparkles, Wand2 } from "lucide-react";

export default function AiGenerateForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    topic: "",
    numQuestions: "10",
    difficulty: "medium",
    visibility: "private",
    quizType: "scored",
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Submitting quiz generation request:", formData);

      // Call the API to generate the quiz
      const response = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: formData.topic,
          numQuestions: formData.numQuestions,
          difficulty: formData.difficulty,
          visibility: formData.visibility,
          quizType: formData.quizType,
          title: `${formData.topic} ${formData.quizType === 'vibe' ? 'Vibe Check' : 'Quiz'}`,
        }),
      });
      
      const data = await response.json();
      console.log("API response status:", response.status);
      console.log("API response data:", data);
      
      if (!response.ok) {
        console.error("Error response:", data);
        throw new Error(data.error || `API error: ${response.status}`);
      }
      
      // Redirect to the quiz page
      router.push(`/dashboard`);
      router.refresh();
    } catch (err) {
      console.error("Quiz creation error details:", err);
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      setError(`Failed to create quiz: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // If loading, show loading state
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative w-full min-h-[400px] md:min-h-[500px] flex flex-col items-center justify-center"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-xl backdrop-blur-sm"></div>
        <Card className="w-full max-w-md z-10 bg-gray-900/80 backdrop-blur shadow-xl border-blue-500/30">
          <CardContent className="pt-6 flex flex-col items-center">
            <motion.div
              animate={{ 
                rotate: [0, 360], 
                scale: [1, 1.1, 1] 
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="mb-4 bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-full"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>

            <h3 className="text-xl font-bold text-white mb-2">Creating Your Quiz</h3>
            <p className="text-blue-200 text-center mb-6">
              Google Gemini is generating{' '}
              <span className="text-yellow-300">{formData.numQuestions} questions</span>{' '}
              about{' '}
              <span className="text-yellow-300">{formData.topic}</span>
            </p>
            
            <div className="relative w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-4">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                animate={{ 
                  x: ['-100%', '100%'],
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 1.5,
                  ease: "easeInOut"
                }}
              />
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center">
              {['Creating Questions', 'Analyzing Topic', 'Making It Creative', 'Adding Options', 'Finalizing'].map((text, i) => (
                <motion.span 
                  key={text}
                  className="px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-300"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeInOut"
                  }}
                >
                  {text}
                </motion.span>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full px-2 sm:px-0"
    >
      <form onSubmit={handleSubmit}>
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-blue-400" />
            <CardTitle className="text-xl">Generate Quiz with AI</CardTitle>
            </div>
            <CardDescription>
              Let Google Gemini create a quiz for you on any topic
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-red-900/30 border border-red-500/30 text-red-300">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="topic" className="text-white">Quiz Topic</Label>
              <Input 
                id="topic" 
                name="topic"
                value={formData.topic}
                onChange={handleInputChange}
                placeholder="e.g., 90s Pop Culture, Space Exploration, Harry Potter..." 
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quizType" className="text-white">Quiz Type</Label>
              <select 
                id="quizType" 
                name="quizType"
                value={formData.quizType}
                onChange={handleInputChange}
                className="w-full bg-gray-800 border border-blue-500/30 text-white rounded-md px-3 py-2 focus:border-blue-500/50 focus-visible:outline-none focus-visible:ring-blue-500/20 focus-visible:ring-[3px]"
              >
                <option value="scored">Scored Quiz - Has right/wrong answers</option>
                <option value="vibe">Vibe Check - No right/wrong answers, analyzes personality</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="numQuestions" className="text-white">Number of Questions</Label>
              <select 
                id="numQuestions" 
                name="numQuestions"
                value={formData.numQuestions}
                onChange={handleInputChange}
                className="w-full bg-gray-800 border border-blue-500/30 text-white rounded-md px-3 py-2 focus:border-blue-500/50 focus-visible:outline-none focus-visible:ring-blue-500/20 focus-visible:ring-[3px]"
              >
                <option value="5">5 Questions</option>
                <option value="10">10 Questions</option>
                <option value="15">15 Questions</option>
                <option value="20">20 Questions</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty" className="text-white">Difficulty Level</Label>
              <select 
                id="difficulty" 
                name="difficulty"
                value={formData.difficulty}
                onChange={handleInputChange}
                className="w-full bg-gray-800 border border-blue-500/30 text-white rounded-md px-3 py-2 focus:border-blue-500/50 focus-visible:outline-none focus-visible:ring-blue-500/20 focus-visible:ring-[3px]"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="visibility" className="text-white">Visibility</Label>
              <select 
                id="visibility" 
                name="visibility"
                value={formData.visibility}
                onChange={handleInputChange}
                className="w-full bg-gray-800 border border-blue-500/30 text-white rounded-md px-3 py-2 focus:border-blue-500/50 focus-visible:outline-none focus-visible:ring-blue-500/20 focus-visible:ring-[3px]"
              >
                <option value="private">Private - Only accessible with link</option>
                <option value="public">Public - Listed in public quizzes</option>
              </select>
            </div>
          </CardContent>
          <CardFooter className="flex gap-3 flex-col sm:flex-row sm:justify-between pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push('/dashboard')}
              disabled={isLoading}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto order-1 sm:order-2"
              disabled={isLoading}
            >
              {formData.quizType === "vibe" ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Vibe Check
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Quiz
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </motion.div>
  );
} 