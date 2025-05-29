"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSupabase } from "@/lib/supabase";
import { useUser } from "@clerk/nextjs";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function UpdateCountsPage() {
  const router = useRouter();
  const { user } = useUser();
  const supabase = useSupabase();
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [updatedCounts, setUpdatedCounts] = useState<Record<string, number>>({});
  
  // Load user's quizzes
  useEffect(() => {
    async function loadQuizzes() {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('quizzes')
          .select('id, title')
          .eq('created_by', user.id);
          
        if (error) throw error;
        
        setQuizzes(data || []);
      } catch (error) {
        console.error('Error loading quizzes:', error);
      }
    }
    
    loadQuizzes();
  }, [user, supabase]);
  
  const updateAllCounts = async () => {
    if (quizzes.length === 0) {
      setMessage("No quizzes found to update");
      return;
    }
    
    setIsLoading(true);
    setMessage("Updating submission counts...");
    
    const newCounts: Record<string, number> = {};
    
    try {
      // Update each quiz's submission count
      for (const quiz of quizzes) {
        try {
          const response = await fetch('/api/quiz/simple-count', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ quizId: quiz.id }),
          });
          
          if (!response.ok) continue;
          
          const data = await response.json();
          
          if (data.success) {
            newCounts[quiz.id] = data.count;
          }
        } catch (error) {
          console.error(`Error updating count for quiz ${quiz.id}:`, error);
        }
      }
      
      setUpdatedCounts(newCounts);
      setMessage(`Successfully updated submission counts for ${Object.keys(newCounts).length} quizzes`);
    } catch (error) {
      console.error('Error updating counts:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container py-8 max-w-3xl mx-auto">
      <Card className="bg-gray-900 border-blue-500/30">
        <CardHeader>
          <CardTitle className="text-white text-2xl">Update Submission Counts</CardTitle>
          <CardDescription className="text-blue-200">
            Fix and update submission counts for all your quizzes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {quizzes.length > 0 ? (
            <div className="bg-gray-800/50 p-4 rounded-md border border-blue-500/20">
              <p className="text-white">You have {quizzes.length} quizzes that can be updated.</p>
            </div>
          ) : (
            <div className="bg-gray-800/50 p-4 rounded-md border border-blue-500/20">
              <p className="text-gray-300">No quizzes found. Create a quiz first.</p>
            </div>
          )}
          
          <Button
            onClick={updateAllCounts}
            disabled={isLoading || quizzes.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 py-3"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : "Update All Submission Counts"}
          </Button>
          
          {message && (
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-md p-4">
              <p className="text-blue-300">{message}</p>
            </div>
          )}
          
          {Object.keys(updatedCounts).length > 0 && (
            <div className="mt-6">
              <h3 className="text-white text-lg mb-3">Updated Counts</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {quizzes.filter(q => updatedCounts[q.id] !== undefined).map(quiz => (
                  <div key={quiz.id} className="bg-gray-800 p-3 rounded-md flex justify-between items-center">
                    <div>
                      <div className="text-white">{quiz.title}</div>
                      <div className="text-sm text-gray-400">ID: {quiz.id}</div>
                    </div>
                    <div className="flex items-center">
                      <span className="text-white font-medium mr-1">{updatedCounts[quiz.id]}</span>
                      <span className="text-gray-400 text-sm">submissions</span>
                      <CheckCircle2 className="ml-2 h-4 w-4 text-green-500" />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button onClick={() => router.push('/dashboard')} className="bg-green-600 hover:bg-green-700">
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 