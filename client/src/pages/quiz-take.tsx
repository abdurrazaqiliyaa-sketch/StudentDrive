import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Clock, CheckCircle, XCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function QuizTake() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const { data: quiz, isLoading } = useQuery<{
    id: string;
    title: string;
    description?: string | null;
    timeLimit?: number | null;
    passingScore?: number | null;
  }>({
    queryKey: ["/api/quizzes", id],
  });

  const { data: questions = [], isLoading: questionsLoading } = useQuery<any[]>({
    queryKey: ["/api/quizzes", id, "questions"],
    enabled: !!quiz,
  });

  useEffect(() => {
    if (quiz?.timeLimit && timeRemaining === null) {
      setTimeRemaining(quiz.timeLimit * 60); // Convert to seconds
    }
  }, [quiz, timeRemaining]);

  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeRemaining === 0) {
      handleSubmit();
    }
  }, [timeRemaining]);

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", `/api/quizzes/${id}/submit`, data);
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-attempts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/stats"] });
      toast({
        title: result.passed ? "Congratulations!" : "Quiz Completed",
        description: `You scored ${result.score}/${result.totalQuestions}. ${
          result.passed ? "You passed!" : "Keep practicing!"
        }`,
      });
      navigate("/quizzes");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to submit quiz",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    submitMutation.mutate({ answers });
    setShowSubmitDialog(false);
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading || questionsLoading) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!quiz || !questions || questions.length === 0) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto text-center">
        <p className="text-muted-foreground">Quiz not found or has no questions</p>
        <Button onClick={() => navigate("/quizzes")} className="mt-4">
          Back to Quizzes
        </Button>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/quizzes")}
          className="mb-4"
          data-testid="button-back-to-quizzes"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Quizzes
        </Button>
        <h1 className="text-section font-heading text-foreground mb-2">
          {quiz.title}
        </h1>
        <p className="text-muted-foreground">{quiz.description}</p>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            {timeRemaining !== null && (
              <Badge variant={timeRemaining < 60 ? "destructive" : "secondary"}>
                <Clock className="mr-1 h-3 w-3" />
                {formatTime(timeRemaining)}
              </Badge>
            )}
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {answeredCount} of {questions.length} answered
          </p>
        </CardContent>
      </Card>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {question.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={answers[question.id] || ""}
            onValueChange={(value) => handleAnswerChange(question.id, value)}
          >
            {question.questionType === "true_false" ? (
              <>
                <div className="flex items-center space-x-3 p-4 rounded-lg border hover-elevate active-elevate-2">
                  <RadioGroupItem value="true" id="true" data-testid="option-true" />
                  <Label htmlFor="true" className="flex-1 cursor-pointer">
                    True
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 rounded-lg border hover-elevate active-elevate-2">
                  <RadioGroupItem value="false" id="false" data-testid="option-false" />
                  <Label htmlFor="false" className="flex-1 cursor-pointer">
                    False
                  </Label>
                </div>
              </>
            ) : (
              (question.options as string[]).map((option, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-4 rounded-lg border hover-elevate active-elevate-2"
                >
                  <RadioGroupItem
                    value={option}
                    id={`option-${index}`}
                    data-testid={`option-${index}`}
                  />
                  <Label
                    htmlFor={`option-${index}`}
                    className="flex-1 cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              ))
            )}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
          data-testid="button-previous"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        {currentQuestion === questions.length - 1 ? (
          <Button
            onClick={() => setShowSubmitDialog(true)}
            disabled={submitMutation.isPending}
            data-testid="button-submit-quiz"
          >
            {submitMutation.isPending ? "Submitting..." : "Submit Quiz"}
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentQuestion((prev) => Math.min(questions.length - 1, prev + 1))}
            data-testid="button-next"
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answeredCount} out of {questions.length} questions.
              {answeredCount < questions.length && (
                <span className="block mt-2 text-destructive">
                  You haven't answered all questions. Unanswered questions will be marked as incorrect.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-submit">Continue Quiz</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} data-testid="button-confirm-submit">
              Submit Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
