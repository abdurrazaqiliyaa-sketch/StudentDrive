import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import RoleSelection from "./role-selection";
import StudentOnboarding from "./student-onboarding";
import InstructorOnboarding from "./instructor-onboarding";
import InstitutionOnboarding from "./institution-onboarding";

export default function Onboarding() {
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<"student" | "instructor" | "institution" | null>(null);

  useEffect(() => {
    if (user?.role) {
      setSelectedRole(user.role as "student" | "instructor" | "institution");
    } else {
      const pendingInstitution = sessionStorage.getItem('pendingInstitutionOnboarding');
      if (pendingInstitution === 'true') {
        sessionStorage.removeItem('pendingInstitutionOnboarding');
        setSelectedRole('institution');
      }
    }
  }, [user?.role]);

  const handleRoleSelect = (role: "student" | "instructor") => {
    setSelectedRole(role);
  };

  const handleOnboardingComplete = () => {
    window.location.href = "/";
  };

  if (!selectedRole) {
    return <RoleSelection onRoleSelect={handleRoleSelect} />;
  }

  if (selectedRole === "student") {
    return <StudentOnboarding onComplete={handleOnboardingComplete} />;
  }

  if (selectedRole === "instructor") {
    return <InstructorOnboarding onComplete={handleOnboardingComplete} />;
  }

  if (selectedRole === "institution") {
    return <InstitutionOnboarding onComplete={handleOnboardingComplete} />;
  }

  return null;
}
