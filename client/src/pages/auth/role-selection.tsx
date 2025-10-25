import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookOpen, GraduationCap, Users, Building2, ArrowRight } from "lucide-react";

interface RoleSelectionProps {
  onRoleSelect: (role: "student" | "instructor") => void;
}

export default function RoleSelection({ onRoleSelect }: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<"student" | "instructor" | null>(null);

  const roles = [
    {
      id: "student" as const,
      title: "Student",
      description: "Access educational resources, take quizzes, and track your academic performance",
      icon: GraduationCap,
      color: "from-purple-500/20 to-purple-600/20 border-purple-500/50 hover:border-purple-500",
      iconColor: "text-purple-600 dark:text-purple-400",
      features: [
        "Access verified lecture notes and study materials",
        "Take interactive quizzes with instant feedback",
        "Track your performance with detailed analytics",
        "Bookmark favorite resources for quick access",
      ],
    },
    {
      id: "instructor" as const,
      title: "Instructor / Tutor",
      description: "Share educational content, create assessments, and monitor student progress",
      icon: Users,
      color: "from-orange-500/20 to-orange-600/20 border-orange-500/50 hover:border-orange-500",
      iconColor: "text-orange-600 dark:text-orange-400",
      features: [
        "Upload and share educational materials",
        "Create custom quizzes and assessments",
        "Monitor student performance and engagement",
        "View detailed analytics on student progress",
      ],
    },
  ];

  const handleContinue = () => {
    if (selectedRole) {
      onRoleSelect(selectedRole);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <Card className="w-full max-w-5xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-2xl font-heading font-bold">StudentDrive</span>
          </div>
          <div>
            <CardTitle className="text-3xl">Welcome to StudentDrive</CardTitle>
            <CardDescription className="text-lg mt-2">
              Choose your role to get started with personalized onboarding
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            {roles.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;
              
              return (
                <Card
                  key={role.id}
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? `bg-gradient-to-br ${role.color} border-2`
                      : "hover:shadow-lg border-2 border-transparent"
                  }`}
                  onClick={() => setSelectedRole(role.id)}
                >
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-3">
                      <div className={`rounded-full p-4 bg-background/50`}>
                        <Icon className={`h-8 w-8 ${role.iconColor}`} />
                      </div>
                    </div>
                    <CardTitle className="text-xl">{role.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {role.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {role.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {selectedRole && (
            <Alert className="bg-primary/10 border-primary/50">
              <AlertDescription className="text-center">
                You've selected <strong>{roles.find(r => r.id === selectedRole)?.title}</strong>. 
                Click continue to complete your profile setup.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-center pt-4">
            <Button
              size="lg"
              onClick={handleContinue}
              disabled={!selectedRole}
              className="min-w-[200px]"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
