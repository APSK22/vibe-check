"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "@/lib/motion";
import { useRouter } from "next/navigation";
import AiGenerateForm from "./aiGenerateForm";

export default function CreateQuizPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    visibility: "private",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Submitting manual quiz creation request:", formData);
      
      // Call the API to create the quiz manually
      const response = await fetch("/api/quiz/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      console.log("API response status:", response.status);
      console.log("API response data:", data);
      
      if (!response.ok) {
        console.error("Error response:", data);
        throw new Error(data.error || `API error: ${response.status}`);
      }
      
      // Redirect to add questions page (later) or back to dashboard
      router.push(`/quiz/${data.quizId}/edit`);
      router.refresh();
    } catch (err) {
      console.error("Manual quiz creation error:", err);
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      setError(`Failed to create quiz: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Create a Quiz</h1>
      </div>
      
      <Tabs defaultValue="manual" className="w-full">
        <TabsList>
          <TabsTrigger value="manual">Create Manually</TabsTrigger>
          <TabsTrigger value="ai">Generate with AI</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manual" className="pt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Quiz Details</CardTitle>
                  <CardDescription>
                    Start by adding basic information about your quiz
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-md bg-red-900/30 border border-red-500/30 text-red-300">
                      {error}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-white">Quiz Title</Label>
                    <Input 
                      id="title" 
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Enter a catchy title" 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-white">Description (Optional)</Label>
                    <Input 
                      id="description" 
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="What's your quiz about?" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visibility" className="text-white">Visibility</Label>
                    <select 
                      id="visibility" 
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
                        Creating...
                      </>
                    ) : (
                      "Create Quiz"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="ai" className="pt-4">
          <AiGenerateForm />
        </TabsContent>
      </Tabs>
    </div>
  );
} 