import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Shield,
  FileText,
  BarChart3,
  TrendingUp,
  Activity,
  BookOpen,
} from "lucide-react";
import { Link } from "wouter";

interface AdminStats {
  totalUsers: number;
  institutionsCount: number;
  contentCount: number;
  activityRate: number;
}

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-section font-heading text-foreground mb-2">
          Admin Control Panel
        </h1>
        <p className="text-muted-foreground">
          Manage platform-wide users, institutions, and content
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-elevate border-role-admin/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-role-admin" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-total-users">
                {stats?.totalUsers || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">All platform users</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate border-role-admin/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Institutions</CardTitle>
            <Shield className="h-4 w-4 text-role-admin" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-institutions">
                {stats?.institutionsCount || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Registered institutions</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate border-role-admin/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
            <FileText className="h-4 w-4 text-role-admin" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-content">
                {stats?.contentCount || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Materials + Quizzes</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate border-role-admin/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Activity</CardTitle>
            <Activity className="h-4 w-4 text-role-admin" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-activity">
                {stats?.activityRate || 0}%
              </div>
            )}
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Management Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-elevate">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-role-admin" />
              User Management
            </CardTitle>
            <CardDescription>Manage all platform users</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild data-testid="button-manage-users">
              <Link href="/admin/users">Manage Users</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-role-admin" />
              Institutions
            </CardTitle>
            <CardDescription>Manage institutional partners</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild data-testid="button-manage-institutions">
              <Link href="/admin/institutions">Manage Institutions</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-role-admin" />
              Courses
            </CardTitle>
            <CardDescription>Manage available courses</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild data-testid="button-manage-courses">
              <Link href="/admin/courses">Manage Courses</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-role-admin" />
              Content Moderation
            </CardTitle>
            <CardDescription>Review and moderate content</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild data-testid="button-moderate-content">
              <Link href="/admin/content">Moderate Content</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Analytics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Platform Analytics</CardTitle>
              <CardDescription>Usage trends and metrics</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild data-testid="button-view-analytics">
              <Link href="/admin/analytics">Detailed Analytics</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p>Platform analytics will be displayed here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
