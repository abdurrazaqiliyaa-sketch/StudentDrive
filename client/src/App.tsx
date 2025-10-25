import type { CSSProperties } from "react";
import { Switch, Route } from "wouter";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/theme-toggle";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import VerifyEmail from "@/pages/auth/verify-email";
import Onboarding from "@/pages/auth/onboarding";
import StudentDashboard from "@/pages/student/dashboard";
import StudentUploadMaterial from "@/pages/student/upload-material";
import InstructorDashboard from "@/pages/instructor/dashboard";
import InstructorCreateMaterial from "@/pages/instructor/create-material";
import InstructorCreateQuiz from "@/pages/instructor/create-quiz";
import InstitutionDashboard from "@/pages/institution/dashboard";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminInstitutions from "@/pages/admin/institutions";
import AdminCourses from "@/pages/admin/courses";
import AdminContentModeration from "@/pages/admin/content-moderation";
import Resources from "@/pages/resources";
import MaterialDetail from "@/pages/material-detail";
import MyLibrary from "@/pages/my-library";
import Bookmarks from "@/pages/bookmarks";
import Quizzes from "@/pages/quizzes";
import QuizTake from "@/pages/quiz-take";
import Performance from "@/pages/performance";
import Settings from "@/pages/settings";

function Router({ showLanding, showOnboarding }: { showLanding?: boolean; showOnboarding?: boolean }) {
  const { isStudent, isInstructor, isInstitution, isAdmin } = useAuth();

  // Show onboarding for verified users who haven't completed onboarding
  if (showOnboarding) {
    return (
      <Switch>
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/" component={Onboarding} />
        <Route component={Onboarding} />
      </Switch>
    );
  }

  // Show auth pages for unauthenticated users
  if (showLanding) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/verify-email" component={VerifyEmail} />
        <Route component={Login} />
      </Switch>
    );
  }

  // Authenticated routes based on role
  return (
    <Switch>
      {/* Student Routes */}
      {isStudent && (
        <>
          <Route path="/" component={StudentDashboard} />
          <Route path="/resources" component={Resources} />
          <Route path="/material/:id" component={MaterialDetail} />
          <Route path="/my-library" component={MyLibrary} />
          <Route path="/student/upload" component={StudentUploadMaterial} />
          <Route path="/quizzes" component={Quizzes} />
          <Route path="/quiz/:id" component={QuizTake} />
          <Route path="/performance" component={Performance} />
          <Route path="/bookmarks" component={Bookmarks} />
          <Route path="/settings" component={Settings} />
        </>
      )}

      {/* Instructor Routes */}
      {isInstructor && (
        <>
          <Route path="/" component={InstructorDashboard} />
          <Route path="/instructor" component={InstructorDashboard} />
          <Route path="/instructor/courses" component={InstructorDashboard} />
          <Route path="/instructor/materials" component={Resources} />
          <Route path="/instructor/materials/create" component={InstructorCreateMaterial} />
          <Route path="/material/:id" component={MaterialDetail} />
          <Route path="/instructor/quizzes" component={Quizzes} />
          <Route path="/instructor/quizzes/create" component={InstructorCreateQuiz} />
          <Route path="/instructor/analytics" component={Performance} />
          <Route path="/settings" component={Settings} />
        </>
      )}

      {/* Institution Routes */}
      {isInstitution && (
        <>
          <Route path="/" component={InstitutionDashboard} />
          <Route path="/institution" component={InstitutionDashboard} />
          <Route path="/institution/students" component={InstitutionDashboard} />
          <Route path="/institution/instructors" component={InstitutionDashboard} />
          <Route path="/institution/courses" component={Resources} />
          <Route path="/material/:id" component={MaterialDetail} />
          <Route path="/institution/analytics" component={Performance} />
          <Route path="/institution/settings" component={Settings} />
          <Route path="/settings" component={Settings} />
        </>
      )}

      {/* Admin Routes */}
      {isAdmin && (
        <>
          <Route path="/" component={AdminDashboard} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/users" component={AdminUsers} />
          <Route path="/admin/institutions" component={AdminInstitutions} />
          <Route path="/admin/courses" component={AdminCourses} />
          <Route path="/admin/content" component={AdminContentModeration} />
          <Route path="/material/:id" component={MaterialDetail} />
          <Route path="/admin/analytics" component={Performance} />
          <Route path="/admin/settings" component={Settings} />
          <Route path="/settings" component={Settings} />
        </>
      )}

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Custom sidebar width for better content display
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Router showLanding={true} />;
  }

  if (user && !user.onboardingCompleted) {
    return <Router showOnboarding={true} />;
  }

  return (
    <SidebarProvider style={style as CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between h-14 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-y-auto">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
