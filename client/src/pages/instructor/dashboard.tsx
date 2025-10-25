import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  FileText,
  Users,
  BarChart3,
  Plus,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function InstructorDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<{
    coursesCount?: number;
    materialsCount?: number;
    studentsCount?: number;
    avgScore?: number;
  }>({
    queryKey: ["/api/instructor/stats"],
  });

  const { data: recentMaterials = [], isLoading: materialsLoading } = useQuery<any[]>({
    queryKey: ["/api/instructor/materials"],
  });

  const { data: recentQuizzes = [], isLoading: quizzesLoading } = useQuery<any[]>({
    queryKey: ["/api/instructor/quizzes"],
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-section font-heading text-foreground mb-2">
            Instructor Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your courses, materials, and track student progress
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild data-testid="button-create-material">
            <Link href="/instructor/materials/create">
              <Plus className="mr-2 h-4 w-4" />
              Add Material
            </Link>
          </Button>
          <Button asChild data-testid="button-create-quiz">
            <Link href="/instructor/quizzes/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Quiz
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-elevate border-role-instructor/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-role-instructor" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-courses">
                {stats?.coursesCount || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Active courses</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate border-role-instructor/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Materials</CardTitle>
            <FileText className="h-4 w-4 text-role-instructor" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-materials">
                {stats?.materialsCount || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Uploaded resources</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate border-role-instructor/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-role-instructor" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-students">
                {stats?.studentsCount || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Enrolled students</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate border-role-instructor/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-role-instructor" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-avg-score">
                {stats?.avgScore || 0}%
              </div>
            )}
            <p className="text-xs text-muted-foreground">Student average</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Materials */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Materials</CardTitle>
                <CardDescription>Your uploaded resources</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild data-testid="button-view-all-materials">
                <Link href="/instructor/materials">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {materialsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))
              ) : recentMaterials && recentMaterials.length > 0 ? (
                recentMaterials.slice(0, 5).map((material: any) => (
                  <div
                    key={material.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover-elevate active-elevate-2"
                    data-testid={`material-${material.id}`}
                  >
                    <div className="h-10 w-10 rounded bg-role-instructor/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-role-instructor" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{material.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {material.course?.title || "No course"}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {material.fileType?.toUpperCase() || "PDF"}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm">No materials yet</p>
                  <Button variant="outline" size="sm" className="mt-4" asChild>
                    <Link href="/instructor/materials/create">Upload Material</Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Quizzes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Quizzes</CardTitle>
                <CardDescription>Your created assessments</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild data-testid="button-view-all-quizzes">
                <Link href="/instructor/quizzes">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quizzesLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))
              ) : recentQuizzes && recentQuizzes.length > 0 ? (
                recentQuizzes.slice(0, 5).map((quiz: any) => (
                  <div
                    key={quiz.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover-elevate active-elevate-2"
                    data-testid={`quiz-${quiz.id}`}
                  >
                    <div className="h-10 w-10 rounded bg-role-instructor/10 flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="h-5 w-5 text-role-instructor" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{quiz.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{quiz.timeLimit ? `${quiz.timeLimit} min` : "No limit"}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {quiz.attemptsCount || 0} attempts
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm">No quizzes yet</p>
                  <Button variant="outline" size="sm" className="mt-4" asChild>
                    <Link href="/instructor/quizzes/create">Create Quiz</Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Analytics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Student Performance</CardTitle>
              <CardDescription>Track how your students are doing</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild data-testid="button-view-analytics">
              <Link href="/instructor/analytics">View Analytics</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p>Performance charts will be displayed here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
