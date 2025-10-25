import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { BookOpen, GraduationCap, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { InstitutionCombobox } from "@/components/ui/institution-combobox";
import type { Institution, Programme } from "@shared/schema";

const onboardingSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"], { required_error: "Please select your gender" }),
  institutionId: z.string().min(1, "Please select your institution"),
  currentLevel: z.number().min(100).max(900),
  yearOfAdmission: z.number().min(2011).max(new Date().getFullYear()),
  expectedGraduationYear: z.number().min(new Date().getFullYear()).max(new Date().getFullYear() + 8),
  modeOfStudy: z.enum(["Full-time", "Part-time"]),
  programmeId: z.string().min(1, "Programme is required"),
  studyGoals: z.array(z.string()).min(2, "Please select at least 2 study goals"),
  learningStyle: z.array(z.string()).min(2, "Please select at least 2 learning styles"),
  studySchedule: z.array(z.string()).min(1, "Please select at least 1 study schedule"),
});

type OnboardingForm = z.infer<typeof onboardingSchema>;

const studyGoalsOptions = [
  "Academic Excellence",
  "Career Advancement",
  "Skill Development",
  "Research & Innovation",
  "Professional Certification",
  "Personal Growth",
  "Networking",
  "Entrepreneurship",
];

const learningStyleOptions = [
  "Visual Learning (diagrams, videos)",
  "Reading & Writing",
  "Hands-on Practice",
  "Group Discussions",
  "Self-paced Learning",
  "Live Lectures",
  "Interactive Tutorials",
  "Real-world Projects",
];

const studyScheduleOptions = [
  "Early Morning (5am - 9am)",
  "Morning (9am - 12pm)",
  "Afternoon (12pm - 5pm)",
  "Evening (5pm - 9pm)",
  "Late Night (9pm - 12am)",
  "Flexible/Anytime",
];

interface StudentOnboardingProps {
  onComplete: () => void;
}

export default function StudentOnboarding({ onComplete }: StudentOnboardingProps) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const { data: institutions } = useQuery<Institution[]>({
    queryKey: ["/api/institutions"],
    retry: false,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      studyGoals: [],
      learningStyle: [],
      studySchedule: [],
    },
  });

  const watchedValues = watch();
  const selectedInstitutionId = watchedValues.institutionId;

  const { data: programmes = [], isLoading: programmesLoading } = useQuery<Programme[]>({
    queryKey: [`/api/programmes/${selectedInstitutionId}`],
    enabled: !!selectedInstitutionId && selectedInstitutionId !== "no-institution",
    retry: false,
  });
  const currentYear = new Date().getFullYear();

  const levels = Array.from({ length: 9 }, (_, i) => (i + 1) * 100);
  const admissionYears = Array.from({ length: currentYear - 2010 }, (_, i) => currentYear - i);
  const graduationYears = Array.from({ length: 9 }, (_, i) => currentYear + i);

  const totalSteps = 6;
  const progress = (step / totalSteps) * 100;

  const toggleArrayValue = (field: "studyGoals" | "learningStyle" | "studySchedule", value: string) => {
    const currentValues = watchedValues[field] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];
    setValue(field, newValues);
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof OnboardingForm)[] = [];
    
    if (step === 1) {
      fieldsToValidate = ["firstName", "lastName", "gender", "institutionId"];
    } else if (step === 2) {
      fieldsToValidate = ["currentLevel", "yearOfAdmission", "expectedGraduationYear", "modeOfStudy"];
    } else if (step === 3) {
      fieldsToValidate = ["programmeId"];
    } else if (step === 4) {
      fieldsToValidate = ["studyGoals"];
    } else if (step === 5) {
      fieldsToValidate = ["learningStyle"];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
      setError("");
    }
  };

  const prevStep = () => {
    setStep(step - 1);
    setError("");
  };

  const onSubmit = async (data: OnboardingForm) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "student",
          ...data,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Onboarding failed");
        setLoading(false);
        return;
      }

      setCompleted(true);
      setLoading(false);
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="space-y-3 text-center">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 dark:bg-green-900 p-4">
                <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-3xl">Congratulations!</CardTitle>
            <CardDescription className="text-lg">
              You've completed your onboarding. You're all set to start learning and exploring StudentDrive.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <Button size="lg" onClick={() => window.location.href = "/"}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-2xl font-heading font-bold">StudentDrive</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {step} of {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <CardTitle className="text-xl mb-2">Personal Information</CardTitle>
                  <CardDescription>Let's start with your basic information</CardDescription>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      {...register("firstName")}
                    />
                    {errors.firstName && (
                      <p className="text-sm text-destructive">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      {...register("lastName")}
                    />
                    {errors.lastName && (
                      <p className="text-sm text-destructive">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select onValueChange={(value) => setValue("gender", value as "male" | "female" | "other" | "prefer_not_to_say")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <p className="text-sm text-destructive">{errors.gender.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="institutionId">Institution *</Label>
                  <InstitutionCombobox
                    institutions={institutions}
                    value={watchedValues.institutionId || ""}
                    onValueChange={(value) => setValue("institutionId", value, { shouldValidate: true })}
                    placeholder="Search for your institution (type at least 3 letters)"
                  />
                  {errors.institutionId && (
                    <p className="text-sm text-destructive">{errors.institutionId.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Type at least 3 letters to search. Select "No institution" if not affiliated.
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <CardTitle className="text-xl mb-2">Academic Information</CardTitle>
                  <CardDescription>Tell us about your current academic status</CardDescription>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentLevel">Current Level *</Label>
                  <Select onValueChange={(value) => setValue("currentLevel", parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your level" />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map((level) => (
                        <SelectItem key={level} value={level.toString()}>
                          {level} Level
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.currentLevel && (
                    <p className="text-sm text-destructive">{errors.currentLevel.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="yearOfAdmission">Year of Admission *</Label>
                    <Select onValueChange={(value) => setValue("yearOfAdmission", parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {admissionYears.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.yearOfAdmission && (
                      <p className="text-sm text-destructive">{errors.yearOfAdmission.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expectedGraduationYear">Expected Graduation Year *</Label>
                    <Select onValueChange={(value) => setValue("expectedGraduationYear", parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {graduationYears.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.expectedGraduationYear && (
                      <p className="text-sm text-destructive">{errors.expectedGraduationYear.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modeOfStudy">Mode of Study *</Label>
                  <Select onValueChange={(value) => setValue("modeOfStudy", value as "Full-time" | "Part-time")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mode of study" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.modeOfStudy && (
                    <p className="text-sm text-destructive">{errors.modeOfStudy.message}</p>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <CardTitle className="text-xl mb-2">Select Your Programme</CardTitle>
                  <CardDescription>Choose your programme of study. This cannot be changed later.</CardDescription>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="programmeId">Programme/Field of Study *</Label>
                  {programmesLoading ? (
                    <p className="text-sm text-muted-foreground">Loading programmes...</p>
                  ) : programmes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No programmes available for the selected institution. Please contact the institution to add programmes.</p>
                  ) : (
                    <Select onValueChange={(value) => setValue("programmeId", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your programme" />
                      </SelectTrigger>
                      <SelectContent>
                        {programmes.map((prog) => (
                          <SelectItem key={prog.id} value={prog.id}>
                            {prog.name} {prog.code ? `(${prog.code})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {errors.programmeId && (
                    <p className="text-sm text-destructive">{errors.programmeId.message}</p>
                  )}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <CardTitle className="text-xl mb-2">Study Goals</CardTitle>
                  <CardDescription>What are your main goals? Select at least 2 that matter most to you.</CardDescription>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {studyGoalsOptions.map((goal) => (
                    <div key={goal} className="flex items-center space-x-2">
                      <Checkbox
                        id={goal}
                        checked={(watchedValues.studyGoals || []).includes(goal)}
                        onCheckedChange={() => toggleArrayValue("studyGoals", goal)}
                      />
                      <Label
                        htmlFor={goal}
                        className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {goal}
                      </Label>
                    </div>
                  ))}
                </div>
                {errors.studyGoals && (
                  <p className="text-sm text-destructive">{errors.studyGoals.message}</p>
                )}
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <CardTitle className="text-xl mb-2">Learning Style</CardTitle>
                  <CardDescription>How do you prefer to learn? Select at least 2 that apply to you.</CardDescription>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {learningStyleOptions.map((style) => (
                    <div key={style} className="flex items-center space-x-2">
                      <Checkbox
                        id={style}
                        checked={(watchedValues.learningStyle || []).includes(style)}
                        onCheckedChange={() => toggleArrayValue("learningStyle", style)}
                      />
                      <Label
                        htmlFor={style}
                        className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {style}
                      </Label>
                    </div>
                  ))}
                </div>
                {errors.learningStyle && (
                  <p className="text-sm text-destructive">{errors.learningStyle.message}</p>
                )}
              </div>
            )}

            {step === 6 && (
              <div className="space-y-6">
                <div>
                  <CardTitle className="text-xl mb-2">Study Schedule</CardTitle>
                  <CardDescription>When are you most productive? Select all that apply.</CardDescription>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {studyScheduleOptions.map((schedule) => (
                    <div key={schedule} className="flex items-center space-x-2">
                      <Checkbox
                        id={schedule}
                        checked={(watchedValues.studySchedule || []).includes(schedule)}
                        onCheckedChange={() => toggleArrayValue("studySchedule", schedule)}
                      />
                      <Label
                        htmlFor={schedule}
                        className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {schedule}
                      </Label>
                    </div>
                  ))}
                </div>
                {errors.studySchedule && (
                  <p className="text-sm text-destructive">{errors.studySchedule.message}</p>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
              )}
              
              {step < totalSteps ? (
                <Button type="button" onClick={nextStep} className="flex-1">
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Completing..." : "Complete Onboarding"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
