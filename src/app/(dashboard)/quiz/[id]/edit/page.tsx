"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSupabase } from "@/lib/supabase";
import { useUser } from "@clerk/nextjs";
import { Trash2, PlusCircle, Save, ArrowLeft, Copy, Facebook, Mail } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";

interface Question {
  id?: string;
  question: string;
  order_num: number;
  options: Option[];
  isNew?: boolean;
}

interface Option {
  id?: string;
  option_text: string;
  is_correct: boolean;
  order_num: number;
  isNew?: boolean;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  is_public: boolean;
  join_code?: string;
}

export default function EditQuizPage() {
  const params = useParams();
  const quizId = params?.id as string;
  const router = useRouter();
  const supabase = useSupabase();
  const { user } = useUser();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("questions");

  // Load quiz and questions
  useEffect(() => {
    async function loadQuizData() {
      if (!user || !quizId) return;

      try {
        // Load quiz details
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .eq('created_by', user.id)
          .single();

        if (quizError) {
          console.error('Error loading quiz:', quizError);
          setError('Failed to load quiz');
          return;
        }

        setQuiz(quizData);

        // Load questions with options
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('quiz_id', quizId)
          .order('order_num');

        if (questionsError) {
          console.error('Error loading questions:', questionsError);
          setError('Failed to load questions');
          return;
        }

        // For each question, load its options
        const questionsWithOptions = await Promise.all(
          questionsData.map(async (q) => {
            const { data: optionsData, error: optionsError } = await supabase
              .from('options')
              .select('*')
              .eq('question_id', q.id)
              .order('order_num');

            if (optionsError) {
              console.error('Error loading options:', optionsError);
              return {
                ...q,
                options: []
              };
            }

            return {
              ...q,
              options: optionsData
            };
          })
        );

        setQuestions(questionsWithOptions);
        
        // Set the first question as active if questions exist
        if (questionsWithOptions.length > 0) {
          setActiveQuestion(0);
        }

      } catch (error) {
        console.error('Error in loadQuizData:', error);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    loadQuizData();
  }, [quizId, supabase, user]);

  const addNewQuestion = () => {
    const newQuestion: Question = {
      question: '',
      order_num: questions.length + 1,
      options: [
        { option_text: '', is_correct: true, order_num: 1, isNew: true },
        { option_text: '', is_correct: false, order_num: 2, isNew: true },
        { option_text: '', is_correct: false, order_num: 3, isNew: true },
        { option_text: '', is_correct: false, order_num: 4, isNew: true }
      ],
      isNew: true
    };

    setQuestions([...questions, newQuestion]);
    setActiveQuestion(questions.length);
    setActiveTab("questions");
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions.splice(index, 1);
    
    // Reorder remaining questions
    updatedQuestions.forEach((q, idx) => {
      q.order_num = idx + 1;
    });
    
    setQuestions(updatedQuestions);
    
    // Update active question
    if (activeQuestion === index) {
      setActiveQuestion(index === 0 ? (updatedQuestions.length > 0 ? 0 : null) : index - 1);
    } else if (activeQuestion !== null && activeQuestion > index) {
      setActiveQuestion(activeQuestion - 1);
    }
  };

  const updateQuestionText = (index: number, text: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].question = text;
    setQuestions(updatedQuestions);
  };

  const updateOptionText = (questionIndex: number, optionIndex: number, text: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex].option_text = text;
    setQuestions(updatedQuestions);
  };

  const updateCorrectOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions];
    
    // Set all options to incorrect first
    updatedQuestions[questionIndex].options.forEach(opt => {
      opt.is_correct = false;
    });
    
    // Set the selected option as correct
    updatedQuestions[questionIndex].options[optionIndex].is_correct = true;
    
    setQuestions(updatedQuestions);
  };

  const updateQuizVisibility = async (isPublic: boolean) => {
    if (!quiz) return;

    try {
      const { error } = await supabase
        .from('quizzes')
        .update({ is_public: isPublic })
        .eq('id', quizId);

      if (error) {
        throw error;
      }

      setQuiz({
        ...quiz,
        is_public: isPublic
      });

      toast.success(`Quiz is now ${isPublic ? 'public' : 'private'}`);
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Failed to update visibility');
    }
  };

  

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success(message))
      .catch(() => toast.error('Failed to copy to clipboard'));
  };

  const saveQuiz = async () => {
    if (!quiz || !user) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Validate questions
      const invalidQuestions = questions.filter(q => !q.question || q.options.some(o => !o.option_text));
      if (invalidQuestions.length > 0) {
        setError('All questions and options must have text');
        setIsSaving(false);
        return;
      }
      
      for (const question of questions) {
        if (!question.options.some(o => o.is_correct)) {
          setError('Each question must have at least one correct answer');
          setIsSaving(false);
          return;
        }
      }
      
      // Save each question and its options
      for (const question of questions) {
        let questionId = question.id;
        
        // If it's a new question, insert it
        if (question.isNew) {
          const { data: newQuestion, error: questionError } = await supabase
            .from('questions')
            .insert({
              quiz_id: quizId,
              question: question.question,
              order_num: question.order_num
            })
            .select()
            .single();
            
          if (questionError) {
            console.error('Error saving question:', questionError);
            throw new Error('Failed to save question');
          }
          
          questionId = newQuestion.id;
        } else {
          // Update existing question
          const { error: updateError } = await supabase
            .from('questions')
            .update({
              question: question.question,
              order_num: question.order_num
            })
            .eq('id', question.id);
            
          if (updateError) {
            console.error('Error updating question:', updateError);
            throw new Error('Failed to update question');
          }
        }
        
        // Save options
        for (const option of question.options) {
          if (option.isNew) {
            // Insert new option
            const { error: optionError } = await supabase
              .from('options')
              .insert({
                question_id: questionId,
                option_text: option.option_text,
                is_correct: option.is_correct,
                order_num: option.order_num
              });
              
            if (optionError) {
              console.error('Error saving option:', optionError);
              throw new Error('Failed to save option');
            }
          } else {
            // Update existing option
            const { error: updateOptionError } = await supabase
              .from('options')
              .update({
                option_text: option.option_text,
                is_correct: option.is_correct,
                order_num: option.order_num
              })
              .eq('id', option.id);
              
            if (updateOptionError) {
              console.error('Error updating option:', updateOptionError);
              throw new Error('Failed to update option');
            }
          }
        }
      }
      
      toast.success('Quiz saved successfully!');
      
      // Redirect to quiz page
      router.push(`/quiz/${quizId}`);
      
    } catch (error) {
      console.error('Error saving quiz:', error);
      setError(error instanceof Error ? error.message : 'Failed to save quiz');
    } finally {
      setIsSaving(false);
    }
  };

  const getShareUrl = () => {
    return `${window.location.origin}/quiz/take/${quizId}`;
  };

  // Social sharing functions
  const shareViaWhatsApp = () => {
    const url = getShareUrl();
    const text = `Join my quiz "${quiz?.title}" 🧠`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`, "_blank");
  };

  const shareViaEmail = () => {
    const url = getShareUrl();
    const subject = encodeURIComponent(`Join my quiz: ${quiz?.title}`);
    const body = encodeURIComponent(`Hi,\n\nI have created a quiz and I would like you to take it. Click the link below to start:\n\n${url}\n\nEnjoy!`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const shareViaFacebook = () => {
    const url = getShareUrl();
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="p-6 bg-gray-900 border border-blue-500/30 rounded-md text-center">
        <h2 className="text-xl font-bold text-white mb-2">Quiz not found</h2>
        <p className="text-blue-200 mb-4">The quiz you are looking for does not exist or you do not have permission to edit it.</p>
        <Link href="/dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/quiz/${quizId}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-white">Edit Quiz: {quiz.title}</h1>
      </div>
      
      {error && (
        <div className="p-3 rounded-md bg-red-900/30 border border-red-500/30 text-red-300">
          {error}
        </div>
      )}
      
      <Tabs defaultValue="questions" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="questions" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Questions
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Settings & Sharing
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="questions">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Questions sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-xl font-bold text-white">Questions</h2>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {questions.map((question, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-md cursor-pointer flex justify-between items-center ${
                      activeQuestion === index
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 text-gray-200 hover:bg-gray-700"
                    }`}
                    onClick={() => setActiveQuestion(index)}
                  >
                    <span className="line-clamp-1">
                      {question.question || `Question ${index + 1}`}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeQuestion(index);
                      }}
                      className="h-6 w-6 rounded-full hover:bg-red-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                onClick={addNewQuestion}
                className="w-full bg-gray-800 hover:bg-gray-700 text-blue-300"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>
            
            {/* Question editor */}
            <div className="lg:col-span-4">
              {activeQuestion !== null && questions[activeQuestion] ? (
                <Card className="bg-gray-900 border-blue-500/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">
                        {activeQuestion + 1}
                      </span>
                      Question {activeQuestion + 1}
                    </CardTitle>
                    <CardDescription className="text-blue-200">
                      Enter your question text and options
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="question-text" className="text-white">Question</Label>
                      <Input
                        id="question-text"
                        value={questions[activeQuestion].question}
                        onChange={(e) => updateQuestionText(activeQuestion, e.target.value)}
                        placeholder="Enter your question"
                        className="bg-gray-800"
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <Label className="text-white">Options</Label>
                      {questions[activeQuestion].options.map((option, optIdx) => (
                        <div 
                          key={optIdx} 
                          className={`p-3 rounded-md border flex items-center gap-3 ${
                            option.is_correct
                              ? "bg-green-900/10 border-green-500/30"
                              : "bg-gray-800/50 border-gray-700"
                          }`}
                        >
                          <span className="rounded-full bg-gray-700 h-6 w-6 flex items-center justify-center text-xs">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <Input
                            value={option.option_text}
                            onChange={(e) =>
                              updateOptionText(activeQuestion, optIdx, e.target.value)
                            }
                            placeholder={`Option ${optIdx + 1}`}
                            className="bg-gray-800 flex-1 border-none"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${activeQuestion}`}
                              checked={option.is_correct}
                              onChange={() => updateCorrectOption(activeQuestion, optIdx)}
                              className="h-4 w-4 text-blue-600"
                            />
                            <Label className="text-sm text-blue-200">Correct</Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-gray-900 border-blue-500/30">
                  <CardHeader>
                    <CardTitle className="text-white">No Questions</CardTitle>
                    <CardDescription className="text-blue-200">
                      Add your first question to get started
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center py-8">
                    <Button
                      onClick={addNewQuestion}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add First Question
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="settings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gray-900 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-white">Visibility & Access</CardTitle>
                <CardDescription className="text-blue-200">
                  Control who can access your quiz
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-y-0">
                  <div>
                    <h4 className="font-medium text-white leading-none mb-1">Public Quiz</h4>
                    <p className="text-sm text-muted-foreground text-gray-400">
                      Make your quiz discoverable to everyone
                    </p>
                  </div>
                  <Switch 
                    checked={quiz.is_public}
                    onCheckedChange={updateQuizVisibility}
                  />
                </div>
                
                
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-white">Share Your Quiz</CardTitle>
                <CardDescription className="text-blue-200">
                  Invite others to take your quiz
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium text-white leading-none mb-3">Quiz Link</h4>
                  <div className="flex gap-2 items-center">
                    <Input 
                      value={getShareUrl()}
                      readOnly
                      className="bg-gray-800 border-gray-700"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => copyToClipboard(getShareUrl(), 'Link copied!')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="border-t border-gray-700 pt-6">
                  <h4 className="font-medium text-white leading-none mb-3">Share on Platforms</h4>
                  <div className="relative">
                    <div className="flex gap-3">
                      <Button 
                        onClick={shareViaWhatsApp}
                        className="bg-green-600 hover:bg-green-700 flex-1"
                      >
                        <WhatsAppIcon className="h-4 w-4 mr-2" />
                        WhatsApp
                      </Button>
                      
                      <Button 
                        onClick={shareViaEmail}
                        className="bg-blue-600 hover:bg-blue-700 flex-1"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Email
                      </Button>
                      
                      <Button 
                        onClick={shareViaFacebook}
                        className="bg-blue-800 hover:bg-blue-900 flex-1"
                      >
                        <Facebook className="h-4 w-4 mr-2" />
                        Facebook
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => router.push(`/quiz/${quizId}`)}
          className="border-gray-700"
        >
          Cancel
        </Button>
        <Button
          onClick={saveQuiz}
          disabled={isSaving || questions.length === 0}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Quiz
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 