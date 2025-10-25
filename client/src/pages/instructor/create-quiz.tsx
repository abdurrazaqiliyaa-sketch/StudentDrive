import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

const quizSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  courseId: z.string().optional(),
  timeLimit: z.string().optional(),
  passingScore: z.string().optional(),
});

type QuizFormValues = z.infer<typeof quizSchema>;

interface Question {
  question: string;
  questionType: "mcq" | "true_false";
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export default function CreateQuiz() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);

  const { data: courses = [] } = useQuery<any[]>({
    queryKey: ["/api/courses"],
  });

  const form = useForm<QuizFormValues>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      title: "",
      description: "",
      courseId: "",
      timeLimit: "",
      passingScore: "70",
    },
  });

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        questionType: "mcq",
        options: ["", "", "", ""],
        correctAnswer: "",
        explanation: "",
      },
    ]);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const createMutation = useMutation({
    mutationFn: async (data: QuizFormValues) => {
      const payload = {
        ...data,
        timeLimit: data.timeLimit ? parseInt(data.timeLimit) : null,
        passingScore: data.passingScore ? parseInt(data.passingScore) : 70,
        questions,
      };
      return await apiRequest("POST", "/api/quizzes", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/instructor/quizzes"] });
      toast({
        title: "Success",
        description: "Quiz created successfully",
      });
      navigate("/instructor/quizzes");
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
        description: "Failed to create quiz",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: QuizFormValues) => {
    if (questions.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one question",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(data);
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/instructor/quizzes")}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Quizzes
        </Button>
        <h1 className="text-section font-heading text-foreground mb-2">
          Create New Quiz
        </h1>
        <p className="text-muted-foreground">
          Build an assessment to test student knowledge
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quiz Details</CardTitle>
          <CardDescription>Basic information about the quiz</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quiz Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Midterm Exam - Calculus" {...field} data-testid="input-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the quiz..."
                        {...field}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-course">
                            <SelectValue placeholder="Select course" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {courses?.map((course: any) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timeLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Limit (min)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="30"
                          {...field}
                          data-testid="input-time-limit"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="passingScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passing Score (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="70"
                          {...field}
                          data-testid="input-passing-score"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Questions</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addQuestion}
                    data-testid="button-add-question"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Question
                  </Button>
                </div>

                <div className="space-y-4">
                  {questions.map((q, index) => (
                    <Card key={index}>
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-4">
                            <Input
                              placeholder={`Question ${index + 1}`}
                              value={q.question}
                              onChange={(e) => updateQuestion(index, "question", e.target.value)}
                              data-testid={`input-question-${index}`}
                            />
                            
                            {q.questionType === "mcq" && (
                              <div className="grid gap-2">
                                {q.options.map((opt, optIndex) => (
                                  <Input
                                    key={optIndex}
                                    placeholder={`Option ${optIndex + 1}`}
                                    value={opt}
                                    onChange={(e) => {
                                      const newOpts = [...q.options];
                                      newOpts[optIndex] = e.target.value;
                                      updateQuestion(index, "options", newOpts);
                                    }}
                                    data-testid={`input-option-${index}-${optIndex}`}
                                  />
                                ))}
                              </div>
                            )}

                            <Input
                              placeholder="Correct Answer"
                              value={q.correctAnswer}
                              onChange={(e) => updateQuestion(index, "correctAnswer", e.target.value)}
                              data-testid={`input-correct-answer-${index}`}
                            />
                          </div>
                          
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeQuestion(index)}
                            data-testid={`button-remove-question-${index}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {questions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No questions yet. Click "Add Question" to get started.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/instructor/quizzes")}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  data-testid="button-submit"
                >
                  {createMutation.isPending ? "Creating..." : "Create Quiz"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
