import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  Target,
  Award,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export default function Performance() {
  const { data: stats, isLoading: statsLoading } = useQuery<{
    averageScore?: number;
    completionRate?: number;
    studyStreak?: number;
    timeSpent?: number;
    weeklyTrend?: Array<{ name: string; score: number; attempts: number }>;
    coursePerformance?: Array<{ course: string; score: number; attempts: number }>;
    strengths?: Array<{ course: string; score: number; attempts: number }>;
    weaknesses?: Array<{ course: string; score: number; attempts: number }>;
  }>({
    queryKey: ["/api/student/performance"],
  });

  const { data: recentAttempts = [], isLoading: attemptsLoading } = useQuery<any[]>({
    queryKey: ["/api/quiz-attempts/recent"],
  });

  // Use real data from API or fallback to empty arrays
  const performanceData = stats?.weeklyTrend || [];
  const subjectData = stats?.coursePerformance?.map(c => ({ subject: c.course, score: c.score })) || [];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-section font-heading text-foreground mb-2">
          Performance Analytics
        </h1>
        <p className="text-muted-foreground">
          Track your progress and identify areas for improvement
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-avg-score">
                {stats?.averageScore || 0}%
              </div>
            )}
            <p className="text-xs text-muted-foreground">Across all quizzes</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-completion-rate">
                {stats?.completionRate || 0}%
              </div>
            )}
            <p className="text-xs text-muted-foreground">Quizzes completed</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-study-streak">
                {stats?.studyStreak || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Days in a row</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Spent</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-time-spent">
                {stats?.timeSpent || 0}h
              </div>
            )}
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trend</CardTitle>
          <CardDescription>Your quiz scores over the past month</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Subject Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Subject</CardTitle>
          <CardDescription>Your average scores across different subjects</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={subjectData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="score" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Strengths and Weaknesses */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Strengths
            </CardTitle>
            <CardDescription>Topics you're excelling in</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {statsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))
            ) : stats?.strengths && stats.strengths.length > 0 ? (
              stats.strengths.map((strength, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{strength.course}</span>
                    <Badge variant="default">{strength.score}%</Badge>
                  </div>
                  <Progress value={strength.score} className="h-2" />
                  <p className="text-xs text-muted-foreground">{strength.attempts} quiz{strength.attempts !== 1 ? 'zes' : ''} taken</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No strengths identified yet</p>
                <p className="text-xs mt-2">Complete more quizzes to see your top performing courses</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-orange-500" />
              Areas for Improvement
            </CardTitle>
            <CardDescription>Topics that need more practice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {statsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))
            ) : stats?.weaknesses && stats.weaknesses.length > 0 ? (
              stats.weaknesses.map((weakness, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{weakness.course}</span>
                    <Badge variant="secondary">{weakness.score}%</Badge>
                  </div>
                  <Progress value={weakness.score} className="h-2" />
                  <p className="text-xs text-muted-foreground">{weakness.attempts} quiz{weakness.attempts !== 1 ? 'zes' : ''} taken</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Great job! No weak areas identified</p>
                <p className="text-xs mt-2">Keep up the excellent work</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Quiz Attempts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Quiz Attempts</CardTitle>
          <CardDescription>Your latest quiz results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {attemptsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))
            ) : recentAttempts && recentAttempts.length > 0 ? (
              recentAttempts.slice(0, 5).map((attempt: any) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                  data-testid={`attempt-${attempt.id}`}
                >
                  <div className="flex-1">
                    <p className="font-semibold">{attempt.quiz?.title || "Quiz"}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(attempt.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {attempt.score}/{attempt.totalQuestions}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round((attempt.score / attempt.totalQuestions) * 100)}%
                      </p>
                    </div>
                    <Badge variant={attempt.passed ? "default" : "destructive"}>
                      {attempt.passed ? "Passed" : "Failed"}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No quiz attempts yet. Start taking quizzes to see your progress!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
