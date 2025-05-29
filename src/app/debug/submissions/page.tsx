"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@clerk/nextjs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function DebugSubmissionsPage() {
  const { user, isLoaded } = useUser();
  const [quizId, setQuizId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [initStatus, setInitStatus] = useState<{success?: boolean; message?: string; error?: string} | null>(null);
  
  useEffect(() => {
    async function initDebugFunctions() {
      try {
        const response = await fetch('/api/sql/create-debug-function');
        const data = await response.json();
        setInitStatus(data);
      } catch (error) {
        console.error('Error initializing debug functions:', error);
        setInitStatus({ success: false, error: String(error) });
      }
    }
    
    if (isLoaded && user) {
      initDebugFunctions();
    }
  }, [isLoaded, user]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quizId) {
      setError("Please enter a quiz ID");
      return;
    }
    
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/quiz/debug-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quizId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to debug submissions');
      }
      
      setResults(data);
    } catch (error) {
      console.error('Error debugging submissions:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isLoaded || !user) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p>Loading or authentication required...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-6 space-y-6">
      <Card className="bg-gray-900 border-blue-500/30">
        <CardHeader>
          <CardTitle className="text-white">Debug Quiz Submissions</CardTitle>
          <CardDescription className="text-blue-200">
            Troubleshoot issues with quiz submission counts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {initStatus && (
            <Alert className={`mb-4 ${initStatus.success ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
              <AlertTitle>{initStatus.success ? 'Ready' : 'Setup Error'}</AlertTitle>
              <AlertDescription>
                {initStatus.message || initStatus.error || "Debug functions are ready"}
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quizId" className="text-white">Quiz ID</Label>
              <Input
                id="quizId"
                value={quizId}
                onChange={(e) => setQuizId(e.target.value)}
                placeholder="Enter the quiz ID to debug"
                className="bg-gray-800 border-gray-700"
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Checking...
                </>
              ) : 'Debug Submissions'}
            </Button>
          </form>
          
          {error && (
            <div className="mt-4 p-3 rounded-md bg-red-900/30 border border-red-500/30 text-red-300">
              {error}
            </div>
          )}
          
          {results && (
            <div className="mt-6 space-y-4">
              <Card className="bg-gray-800 border-blue-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-lg">Quiz Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-700/50 p-2 rounded-md">
                      <span className="text-gray-400">Quiz ID</span>
                      <div className="text-white font-mono">{results.quiz_id}</div>
                    </div>
                    <div className="bg-gray-700/50 p-2 rounded-md">
                      <span className="text-gray-400">Owner</span>
                      <div className="text-white font-mono">{results.quiz_owner}</div>
                    </div>
                    <div className="bg-gray-700/50 p-2 rounded-md">
                      <span className="text-gray-400">Current User</span>
                      <div className="text-white font-mono">{results.user_id}</div>
                    </div>
                    <div className="bg-gray-700/50 p-2 rounded-md">
                      <span className="text-gray-400">You are Owner</span>
                      <div className="text-white">{results.is_owner ? 'Yes' : 'No'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-blue-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-lg">Direct Count Query</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-700/50 p-3 rounded-md">
                    <span className="text-gray-400">Submission Count</span>
                    <div className="text-white text-xl font-bold">{results.direct_count.count ?? 'Error'}</div>
                    {results.direct_count.error && (
                      <div className="text-red-300 text-sm mt-2">{results.direct_count.error}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-gray-800 border-blue-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg">Total Submissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-700/50 p-3 rounded-md">
                      <span className="text-gray-400">Count</span>
                      <div className="text-white text-xl font-bold">{results.total_submissions.count ?? 'Error'}</div>
                    </div>
                    
                    {results.total_submissions.error ? (
                      <div className="mt-2 text-red-300 text-sm">
                        {results.total_submissions.error}
                      </div>
                    ) : (
                      <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                        {results.total_submissions.records?.map((sub: any, i: number) => (
                          <div key={i} className="text-xs bg-gray-700 p-2 rounded font-mono">
                            <div><span className="text-purple-300">id:</span> {sub.id}</div>
                            <div><span className="text-purple-300">user:</span> {sub.user_id}</div>
                            <div><span className="text-purple-300">score:</span> {sub.score}/{sub.max_score}</div>
                            <div><span className="text-purple-300">date:</span> {new Date(sub.completed_at).toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-800 border-blue-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg">Your Submissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-700/50 p-3 rounded-md">
                      <span className="text-gray-400">Count</span>
                      <div className="text-white text-xl font-bold">{results.user_submissions.count ?? 'Error'}</div>
                    </div>
                    
                    {results.user_submissions.error ? (
                      <div className="mt-2 text-red-300 text-sm">
                        {results.user_submissions.error}
                      </div>
                    ) : (
                      <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                        {results.user_submissions.records?.map((sub: any, i: number) => (
                          <div key={i} className="text-xs bg-gray-700 p-2 rounded font-mono">
                            <div><span className="text-purple-300">id:</span> {sub.id}</div>
                            <div><span className="text-purple-300">score:</span> {sub.score}/{sub.max_score}</div>
                            <div><span className="text-purple-300">date:</span> {new Date(sub.completed_at).toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <Card className="bg-gray-800 border-blue-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-lg">Database Policies</CardTitle>
                </CardHeader>
                <CardContent>
                  {results.policies.error ? (
                    <div className="text-red-300 text-sm">
                      {results.policies.error}
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-gray-400 border-b border-gray-700">
                            <th className="text-left p-2">Policy Name</th>
                            <th className="text-left p-2">Action</th>
                            <th className="text-left p-2">Command</th>
                            <th className="text-left p-2">Roles</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.policies.data?.map((policy: any, i: number) => (
                            <tr key={i} className="border-b border-gray-700/50 text-white">
                              <td className="p-2">{policy.policyname}</td>
                              <td className="p-2">{policy.action}</td>
                              <td className="p-2">{policy.cmd}</td>
                              <td className="p-2">{policy.roles}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 