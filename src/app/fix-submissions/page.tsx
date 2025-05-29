"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, CheckCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";

export default function FixSubmissionsPage() {
  const router = useRouter();
  const { isLoaded, user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>("");
  
  const fixSubmissions = async () => {
    setIsLoading(true);
    setStatus('loading');
    setMessage("Fixing submission counts...");
    
    try {
      // Step 1: Create the necessary SQL functions
      const initResponse = await fetch('/api/sql/create-debug-function');
      if (!initResponse.ok) throw new Error("Failed to create SQL functions");
      
      // Step 2: Fix the RLS policies
      const rlsResponse = await fetch('/api/sql/fix-submissions-rls');
      if (!rlsResponse.ok) throw new Error("Failed to fix RLS policies");
      
      setStatus('success');
      setMessage("Submission counts have been fixed! You should now see the correct number of submissions for your quizzes.");
    } catch (error) {
      console.error('Error fixing submissions:', error);
      setStatus('error');
      setMessage(`Failed to fix submission counts: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isLoaded || !user) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p>You must be signed in to fix submission counts.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-6 max-w-2xl mx-auto">
      <Card className="bg-gray-900 border-blue-500/30">
        <CardHeader>
          <CardTitle className="text-white text-2xl">Fix Quiz Submission Counts</CardTitle>
          <CardDescription className="text-blue-200">
            Resolve issues with missing or incorrect submission counts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-800/50 p-4 rounded-md border border-blue-500/20">
            <h3 className="text-white text-lg mb-2">What This Does</h3>
            <p className="text-gray-300">
              This utility fixes issues with quiz submission counts by:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-300">
              <li>Creating database functions to bypass RLS restrictions</li>
              <li>Updating database policies to correctly count submissions</li>
              <li>Ensuring quiz owners can see all submissions for their quizzes</li>
            </ul>
          </div>
          
          {status === 'idle' && (
            <Button
              onClick={fixSubmissions}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg"
            >
              Fix Submission Counts
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          )}
          
          {status === 'loading' && (
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-md p-4 flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
              <p className="text-blue-300">{message}</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="bg-green-900/20 border border-green-500/30 rounded-md p-4 flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-4">
                <p className="text-green-300">{message}</p>
                <div className="flex gap-3">
                  <Button onClick={() => router.push('/dashboard')} className="bg-green-600 hover:bg-green-700">
                    Go to Dashboard
                  </Button>
                  <Button onClick={() => router.push('/debug/submissions')} variant="outline" className="border-green-500/30">
                    Debug Submissions
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {status === 'error' && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-md p-4 flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-4">
                <p className="text-red-300">{message}</p>
                <Button onClick={() => setStatus('idle')} className="bg-red-600 hover:bg-red-700">
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 