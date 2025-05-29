"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, ExternalLink } from "lucide-react";

interface QuizDiagnostics {
  quizId?: string;
  adminClient?: {
    quizExists?: boolean;
    quizData?: {
      title?: string;
      isPublic?: boolean;
      createdBy?: string;
    };
    questionCount?: number;
  };
  regularClient?: {
    canAccessQuiz?: boolean;
    canAccessQuestions?: boolean;
  };
  analysis?: {
    isCreator?: boolean;
    shouldHaveAccess?: boolean;
    actualAccess?: boolean;
    possibleIssue?: string;
  };
  accessEndpoint?: {
    status: number;
    success: boolean;
    data: Record<string, unknown>;
  };
}

export default function QuizDebugPage() {
  const { user: _user, isSignedIn: _isSignedIn } = useUser();
  const [quizId, setQuizId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<QuizDiagnostics | null>(null);

  const debugQuiz = async () => {
    if (!quizId) {
      setError("Please enter a quiz ID");
      return;
    }
    
    setLoading(true);
    setError(null);
    setResults(null);
    
    try {
      // Call our debug API
      const response = await fetch("/api/quiz/debug", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quizId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || "Failed to debug quiz");
        return;
      }
      
      setResults(data.diagnostics);
      
      // Also try the new access endpoint
      const accessResponse = await fetch("/api/quiz/access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quizId }),
      });
      
      const accessData = await accessResponse.json();
      
      setResults((prev: QuizDiagnostics | null) => ({
        ...prev!,
        accessEndpoint: {
          status: accessResponse.status,
          success: accessResponse.ok,
          data: accessResponse.ok ? { 
            title: accessData.quiz?.title,
            isPublic: accessData.quiz?.is_public,
            questionCount: accessData.quiz?.questions?.length || 0
          } : accessData
        }
      }));
      
    } catch (err) {
      console.error("Error debugging quiz:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };
  
  const tryTakeQuiz = () => {
    if (quizId) {
      window.open(`/quiz/take/${quizId}`, '_blank');
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card className="bg-gray-900 border-blue-500/30 mb-6">
        <CardHeader>
          <CardTitle className="text-white">Quiz Debug Tool</CardTitle>
          <CardDescription className="text-blue-200">
            Diagnose issues with quiz access permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Enter Quiz ID"
              value={quizId}
              onChange={(e) => setQuizId(e.target.value)}
              className="bg-gray-800 border-blue-500/20 text-white"
            />
            <Button 
              onClick={debugQuiz} 
              disabled={loading || !quizId}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Running..." : "Debug"}
            </Button>
            <Button 
              onClick={tryTakeQuiz} 
              disabled={!quizId}
              variant="outline"
              className="border-blue-500/30 text-blue-400 hover:bg-blue-900/30"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Take Quiz
            </Button>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-900/40 border border-red-500/50 text-red-200 rounded flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>
      
      {results && (
        <div className="space-y-6">
          <Card className="bg-gray-900 border-blue-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                Quiz Summary
                <Badge className={results.adminClient?.quizExists ? "bg-green-600" : "bg-red-600"}>
                  {results.adminClient?.quizExists ? "EXISTS" : "NOT FOUND"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.adminClient?.quizExists ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-800 p-3 rounded">
                      <div className="text-gray-400 text-sm">Title</div>
                      <div className="text-white font-medium">{results.adminClient.quizData?.title || "Unknown"}</div>
                    </div>
                    <div className="bg-gray-800 p-3 rounded">
                      <div className="text-gray-400 text-sm">Visibility</div>
                      <div className="text-white font-medium flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${results.adminClient.quizData?.isPublic ? "bg-green-500" : "bg-yellow-500"}`}></div>
                        {results.adminClient.quizData?.isPublic ? "Public" : "Private"}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-800 p-3 rounded">
                      <div className="text-gray-400 text-sm">Created By</div>
                      <div className="text-white font-medium flex items-center gap-2">
                        <Badge className={results.analysis?.isCreator ? "bg-green-600" : "bg-gray-600"}>
                          {results.analysis?.isCreator ? "YOU" : "OTHER USER"}
                        </Badge>
                        {results.adminClient.quizData?.createdBy}
                      </div>
                    </div>
                    <div className="bg-gray-800 p-3 rounded">
                      <div className="text-gray-400 text-sm">Questions</div>
                      <div className="text-white font-medium">
                        {results.adminClient.questionCount || 0}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-red-900/30 p-4 rounded border border-red-500/40 text-red-200">
                  The quiz with ID <span className="font-mono">{results.quizId}</span> does not exist in the database.
                </div>
              )}
            </CardContent>
          </Card>
          
          {results.adminClient?.quizExists && (
            <>
              <Card className="bg-gray-900 border-blue-500/30">
                <CardHeader>
                  <CardTitle className="text-white">Access Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-gray-800 p-4 rounded">
                      <h3 className="text-lg text-white mb-2">Permission Check</h3>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-gray-300">Should have access:</div>
                        <Badge className={results.analysis?.shouldHaveAccess ? "bg-green-600" : "bg-red-600"}>
                          {results.analysis?.shouldHaveAccess ? "YES" : "NO"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-gray-300">Actual access with RLS:</div>
                        <Badge className={results.analysis?.actualAccess ? "bg-green-600" : "bg-red-600"}>
                          {results.analysis?.actualAccess ? "YES" : "NO"}
                        </Badge>
                      </div>
                      
                      {results.analysis?.possibleIssue && (
                        <div className="mt-3 p-3 bg-yellow-900/30 border border-yellow-500/40 rounded text-yellow-200">
                          {results.analysis?.possibleIssue}
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-800 p-4 rounded">
                        <h3 className="text-white mb-2">Regular Client (With RLS)</h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className={`h-3 w-3 rounded-full ${results.regularClient?.canAccessQuiz ? "bg-green-500" : "bg-red-500"}`}></div>
                            <div className="text-gray-300">Can access quiz</div>
                          </div>
                          {results.regularClient?.canAccessQuiz && (
                            <div className="flex items-center gap-2">
                              <div className={`h-3 w-3 rounded-full ${results.regularClient?.canAccessQuestions ? "bg-green-500" : "bg-red-500"}`}></div>
                              <div className="text-gray-300">Can access questions</div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-gray-800 p-4 rounded">
                        <h3 className="text-white mb-2">Admin Client (Bypassing RLS)</h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-green-500"></div>
                            <div className="text-gray-300">Can access quiz</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-green-500"></div>
                            <div className="text-gray-300">Can access questions</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-900 border-blue-500/30">
                <CardHeader>
                  <CardTitle className="text-white">New Access API Test</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`p-4 rounded ${results.accessEndpoint?.success ? "bg-green-900/30 border border-green-500/40" : "bg-red-900/30 border border-red-500/40"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={results.accessEndpoint?.success ? "bg-green-600" : "bg-red-600"}>
                        Status: {results.accessEndpoint?.status || "Unknown"}
                      </Badge>
                      <div className="text-white font-medium">
                        {results.accessEndpoint?.success ? "Access successful" : "Access failed"}
                      </div>
                    </div>
                    
                    {results.accessEndpoint?.success ? (
                      <div className="text-green-200">
                        Successfully accessed &quot;{results.accessEndpoint.data?.title}&quot; with {results.accessEndpoint.data?.questionCount} questions.
                      </div>
                    ) : (
                      <div className="text-red-200">
                        Error: {results.accessEndpoint?.data?.error || "Unknown error"}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="text-gray-400 text-sm flex items-center gap-1">
                    <Clock className="h-4 w-4" /> 
                    Tested at {new Date().toLocaleTimeString()}
                  </div>
                </CardFooter>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
} 