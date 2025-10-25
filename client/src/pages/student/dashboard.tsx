import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  ClipboardCheck,
  TrendingUp,
  Award,
  Clock,
  Star,
  ArrowRight,
  Bookmark,
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function StudentDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<{
    materialsCount?: number;
    quizzesCompleted?: number;
    averageScore?: number;
    achievementsCount?: number;
    completionRate?: number;
    studyStreak?: number;
  }>({
    queryKey: ["/api/student/stats"],
  });

  const { data: recentMaterials = [], isLoading: materialsLoading } = useQuery<any[]>({
    queryKey: ["/api/materials/recent"],
  });

  const { data: upcomingQuizzes = [], isLoading: quizzesLoading } = useQuery<any[]>({
    queryKey: ["/api/quizzes/upcoming"],
  });

  const { data: achievements = [], isLoading: achievementsLoading } = useQuery<any[]>({
    queryKey: ["/api/student/achievements"],
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-section font-heading text-foreground mb-2">
          Welcome back, {user?.firstName || "Student"}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your learning today
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Materials</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-materials">
                {stats?.materialsCount || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Accessed this month</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quizzes Completed</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-quizzes">
                {stats?.quizzesCompleted || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Total attempts</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-average-score">
                {stats?.averageScore || 0}%
              </div>
            )}
            <p className="text-xs text-muted-foreground">Across all quizzes</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-achievements">
                {stats?.achievementsCount || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Badges earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Materials */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Materials</CardTitle>
                <CardDescription>Continue where you left off</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild data-testid="button-view-all-materials">
                <Link href="/resources">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {materialsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <Skeleton className="h-16 w-16 rounded-md" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : recentMaterials && recentMaterials.length > 0 ? (
                recentMaterials.slice(0, 5).map((material: any) => (
                  <div
                    key={material.id}
                    className="flex items-start gap-4 p-3 rounded-lg hover-elevate active-elevate-2"
                    data-testid={`material-${material.id}`}
                  >
                    <Link
                      href={`/material/${material.id}`}
                      className="flex items-start gap-4 flex-1 min-w-0"
                    >
                      <div className="h-16 w-16 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-1 truncate hover:text-primary transition-colors">
                          {material.title}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {material.description || "No description available"}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {material.fileType?.toUpperCase() || "PDF"}
                          </Badge>
                          {material.course && (
                            <span className="text-xs text-muted-foreground">
                              {material.course.title}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                    <Button variant="ghost" size="icon" className="flex-shrink-0">
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No materials yet. Start exploring!</p>
                  <Button variant="outline" size="sm" className="mt-4" asChild>
                    <Link href="/resources">Browse Resources</Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Quizzes */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Quizzes</CardTitle>
            <CardDescription>Practice and improve</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quizzesLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))
              ) : upcomingQuizzes && upcomingQuizzes.length > 0 ? (
                upcomingQuizzes.slice(0, 4).map((quiz: any) => (
                  <div
                    key={quiz.id}
                    className="p-4 rounded-lg border hover-elevate active-elevate-2"
                    data-testid={`quiz-${quiz.id}`}
                  >
                    <h4 className="font-semibold text-sm mb-2">{quiz.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <Clock className="h-3 w-3" />
                      <span>{quiz.timeLimit ? `${quiz.timeLimit} min` : "No limit"}</span>
                      <span>•</span>
                      <span>{quiz.questionsCount || 0} questions</span>
                    </div>
                    <Button size="sm" className="w-full" asChild data-testid={`button-start-quiz-${quiz.id}`}>
                      <Link href={`/quiz/${quiz.id}`}>Start Quiz</Link>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm">No quizzes available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Achievements</CardTitle>
              <CardDescription>Celebrate your progress</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/achievements">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {achievementsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-32 flex-shrink-0" />
              ))
            ) : achievements && achievements.length > 0 ? (
              achievements.slice(0, 6).map((achievement: any) => (
                <div
                  key={achievement.id}
                  className="flex-shrink-0 w-32 p-4 rounded-lg bg-achievement-gold/10 border border-achievement-gold/20 text-center"
                  data-testid={`achievement-${achievement.id}`}
                >
                  <Star className="h-8 w-8 mx-auto mb-2 text-achievement-gold" />
                  <p className="text-xs font-semibold">{achievement.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {achievement.date}
                  </p>
                </div>
              ))
            ) : (
              <div className="w-full text-center py-8 text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm">Complete quizzes to earn achievements</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Your progress this month</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild data-testid="button-view-analytics">
              <Link href="/performance">
                Detailed Analytics
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Quiz Completion Rate</span>
              <span className="text-sm text-muted-foreground">
                {stats?.completionRate || 0}%
              </span>
            </div>
            <Progress value={stats?.completionRate || 0} className="h-2" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Study Streak</span>
              <span className="text-sm text-muted-foreground">
                {stats?.studyStreak || 0} days
              </span>
            </div>
            <Progress value={Math.min((stats?.studyStreak || 0) * 10, 100)} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
