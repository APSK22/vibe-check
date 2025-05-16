"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "@/lib/motion";

export default function AiGenerateForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    topic: "",
    numQuestions: "10",
    difficulty: "medium",
    visibility: "private",
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
          title: `${formData.topic} Quiz`,
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
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Generate Quiz with AI</CardTitle>
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
          <CardFooter className="flex justify-between pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push('/dashboard')}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                "Generate Quiz"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </motion.div>
  );
} 