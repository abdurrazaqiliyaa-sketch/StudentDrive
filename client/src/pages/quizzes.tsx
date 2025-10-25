import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipboardList, Search, Clock, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function Quizzes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const { isAdmin } = useAuth();

  const { data: quizzes = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/quizzes", { search: searchTerm, course: courseFilter }],
  });

  const { data: courses = [] } = useQuery<any[]>({
    queryKey: ["/api/courses"],
  });

  const { data: attempts = [] } = useQuery<any[]>({
    queryKey: ["/api/quiz-attempts"],
  });

  const getQuizStatus = (quizId: string) => {
    const quizAttempts = attempts?.filter((a: any) => a.quizId === quizId) || [];
    if (quizAttempts.length === 0) return { status: "not-started", text: "Not Started", color: "secondary" };
    const lastAttempt = quizAttempts[quizAttempts.length - 1];
    if (lastAttempt.passed) return { status: "passed", text: "Passed", color: "default" };
    return { status: "failed", text: "Try Again", color: "destructive" };
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-section font-heading text-foreground mb-2">
          Quizzes
        </h1>
        <p className="text-muted-foreground">
          Practice and test your knowledge with interactive quizzes
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-available-quizzes">
              {quizzes?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Total quizzes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-completed-quizzes">
              {attempts?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Quiz attempts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-pass-rate">
              {attempts && attempts.length > 0
                ? Math.round((attempts.filter((a: any) => a.passed).length / attempts.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Success rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search quizzes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-quizzes"
              />
            </div>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-course-filter">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses?.map((course: any) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quizzes List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-3/4 mb-4" />
                <Skeleton className="h-3 w-1/2 mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))
        ) : quizzes && quizzes.length > 0 ? (
          quizzes.map((quiz: any) => {
            const status = getQuizStatus(quiz.id);
            return (
              <Card key={quiz.id} className="hover-elevate" data-testid={`quiz-card-${quiz.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-2">
                      {quiz.title}
                    </CardTitle>
                    <Badge variant={status.color as any}>
                      {status.text}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {quiz.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{quiz.timeLimit ? `${quiz.timeLimit} min` : "No limit"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ClipboardList className="h-4 w-4" />
                      <span>{quiz.questionsCount || 0} questions</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {quiz.course && (
                      <Badge variant="outline" className="text-xs">
                        {quiz.course.title}
                      </Badge>
                    )}
                    {isAdmin && quiz.moderationStatus && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          quiz.moderationStatus === 'approved' ? 'bg-green-50 text-green-700 border-green-300' :
                          quiz.moderationStatus === 'rejected' ? 'bg-red-50 text-red-700 border-red-300' :
                          'bg-yellow-50 text-yellow-700 border-yellow-300'
                        }`}
                      >
                        {quiz.moderationStatus}
                      </Badge>
                    )}
                  </div>
                  <Button className="w-full" asChild data-testid={`button-start-quiz-${quiz.id}`}>
                    <Link href={`/quiz/${quiz.id}`}>
                      {status.status === "not-started" ? "Start Quiz" : "Retake Quiz"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <ClipboardList className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">No quizzes found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
