import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  BookOpen,
  BarChart3,
  TrendingUp,
  UserCheck,
  FileText,
  GraduationCap,
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import type { User, Programme } from "@shared/schema";

export default function InstitutionDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<{
    studentsCount?: number;
    instructorsCount?: number;
    programmesCount?: number;
    coursesCount?: number;
  }>({
    queryKey: ["/api/institution/stats"],
  });

  const { data: instructors, isLoading: instructorsLoading } = useQuery<User[]>({
    queryKey: ["/api/institution/instructors"],
  });

  const { data: students, isLoading: studentsLoading } = useQuery<User[]>({
    queryKey: ["/api/institution/students"],
  });

  const { data: programmes, isLoading: programmesLoading } = useQuery<Programme[]>({
    queryKey: ["/api/institution/programmes"],
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-section font-heading text-foreground mb-2">
          Institution Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage your institution, students, and track overall performance
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-elevate border-role-institution/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-role-institution" />
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

        <Card className="hover-elevate border-role-institution/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instructors</CardTitle>
            <UserCheck className="h-4 w-4 text-role-institution" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-instructors">
                {stats?.instructorsCount || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Active instructors</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate border-role-institution/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Programmes</CardTitle>
            <GraduationCap className="h-4 w-4 text-role-institution" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-programmes">
                {stats?.programmesCount || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Available programmes</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate border-role-institution/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-role-institution" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="stat-courses">
                {stats?.coursesCount || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Available courses</p>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Institution Management</CardTitle>
          <CardDescription>View and manage your institution's members and programmes</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="students" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="instructors">Instructors</TabsTrigger>
              <TabsTrigger value="programmes">Programmes</TabsTrigger>
            </TabsList>

            <TabsContent value="students" className="space-y-4">
              {studentsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : students && students.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Mode of Study</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">
                            {student.firstName} {student.lastName}
                          </TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>{student.currentLevel || 'N/A'}</TableCell>
                          <TableCell>{student.modeOfStudy || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={student.onboardingCompleted ? "default" : "secondary"}>
                              {student.onboardingCompleted ? "Active" : "Pending"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p>No students have joined your institution yet</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="instructors" className="space-y-4">
              {instructorsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : instructors && instructors.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Experience</TableHead>
                        <TableHead>Specialization</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {instructors.map((instructor) => (
                        <TableRow key={instructor.id}>
                          <TableCell className="font-medium">
                            {instructor.firstName} {instructor.lastName}
                          </TableCell>
                          <TableCell>{instructor.email}</TableCell>
                          <TableCell>
                            {instructor.yearsOfExperience ? `${instructor.yearsOfExperience} years` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {instructor.specialization && instructor.specialization.length > 0
                              ? instructor.specialization.slice(0, 2).join(", ")
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={instructor.onboardingCompleted ? "default" : "secondary"}>
                              {instructor.onboardingCompleted ? "Active" : "Pending"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <UserCheck className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p>No instructors have joined your institution yet</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="programmes" className="space-y-4">
              {programmesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : programmes && programmes.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Programme Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Degree</TableHead>
                        <TableHead>Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {programmes.map((programme) => (
                        <TableRow key={programme.id}>
                          <TableCell className="font-medium">{programme.name}</TableCell>
                          <TableCell>{programme.code || 'N/A'}</TableCell>
                          <TableCell>{programme.degree || 'N/A'}</TableCell>
                          <TableCell>
                            {programme.duration ? `${programme.duration} years` : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <GraduationCap className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p>No programmes have been added to your institution yet</p>
                  <p className="text-sm mt-2">Contact an administrator to add programmes</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
