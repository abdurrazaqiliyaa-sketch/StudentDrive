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
import { Users, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { InstitutionCombobox } from "@/components/ui/institution-combobox";
import type { Institution } from "@shared/schema";

const instructorOnboardingSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"], {
    required_error: "Please select your gender",
  }),
  institutionId: z.string().min(1, "Please select your institution"),
  specialization: z.array(z.string()).min(1, "Please select at least 1 specialization area"),
  yearsOfExperience: z.number().min(0).max(50),
  teachingSubjects: z.array(z.string()).min(1, "Please select at least 1 teaching subject"),
  qualifications: z.array(z.string()).min(1, "Please select at least 1 qualification"),
  teachingMethods: z.array(z.string()).min(1, "Please select at least 1 teaching method"),
  bio: z.string().min(10, "Please provide a brief bio (minimum 10 characters)").max(500, "Bio must be less than 500 characters"),
});

type InstructorOnboardingForm = z.infer<typeof instructorOnboardingSchema>;

const specializationOptions = [
  "Computer Science",
  "Software Engineering",
  "Data Science",
  "Artificial Intelligence",
  "Cyber Security",
  "Web Development",
  "Mobile Development",
  "Database Systems",
  "Networking",
  "Mathematics",
  "Physics",
  "Other",
];

const teachingSubjectOptions = [
  "Programming Fundamentals",
  "Data Structures & Algorithms",
  "Web Development",
  "Mobile App Development",
  "Database Management",
  "Software Engineering",
  "Machine Learning",
  "Artificial Intelligence",
  "Cyber Security",
  "Computer Networks",
  "Operating Systems",
  "Mathematics",
  "Other",
];

const qualificationOptions = [
  "Ph.D. in Computer Science",
  "Ph.D. in Engineering",
  "Master's Degree",
  "Bachelor's Degree",
  "Professional Certification",
  "Industry Experience (5+ years)",
  "Teaching Certification",
  "Other",
];

const teachingMethodOptions = [
  "Interactive Lectures",
  "Hands-on Projects",
  "Video Tutorials",
  "Live Coding Sessions",
  "Problem-Based Learning",
  "Flipped Classroom",
  "Group Discussions",
  "Self-Paced Learning",
];

interface InstructorOnboardingProps {
  onComplete: () => void;
}

export default function InstructorOnboarding({ onComplete }: InstructorOnboardingProps) {
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
  } = useForm<InstructorOnboardingForm>({
    resolver: zodResolver(instructorOnboardingSchema),
    defaultValues: {
      specialization: [],
      teachingSubjects: [],
      qualifications: [],
      teachingMethods: [],
    },
  });

  const watchedValues = watch();
  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const toggleArrayValue = (
    field: "specialization" | "teachingSubjects" | "qualifications" | "teachingMethods",
    value: string
  ) => {
    const currentValues = watchedValues[field] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];
    setValue(field, newValues);
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof InstructorOnboardingForm)[] = [];

    if (step === 1) {
      fieldsToValidate = ["firstName", "lastName", "gender", "institutionId"];
    } else if (step === 2) {
      fieldsToValidate = ["specialization", "yearsOfExperience"];
    } else if (step === 3) {
      fieldsToValidate = ["teachingSubjects"];
    } else if (step === 4) {
      fieldsToValidate = ["qualifications"];
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

  const onSubmit = async (data: InstructorOnboardingForm) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "instructor",
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
            <CardTitle className="text-3xl">Welcome Aboard!</CardTitle>
            <CardDescription className="text-lg">
              Your instructor profile is complete. You're ready to start sharing knowledge and creating impact.
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
            <Users className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            <span className="text-2xl font-heading font-bold">Instructor Setup</span>
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
                  <CardTitle className="text-xl mb-2">Teaching Experience</CardTitle>
                  <CardDescription>Tell us about your expertise and experience</CardDescription>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearsOfExperience">Years of Teaching Experience *</Label>
                  <Select onValueChange={(value) => setValue("yearsOfExperience", parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Less than 1 year</SelectItem>
                      <SelectItem value="1">1-2 years</SelectItem>
                      <SelectItem value="3">3-5 years</SelectItem>
                      <SelectItem value="6">6-10 years</SelectItem>
                      <SelectItem value="11">10+ years</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.yearsOfExperience && (
                    <p className="text-sm text-destructive">{errors.yearsOfExperience.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Areas of Specialization * (Select at least 1)</Label>
                  <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2 border rounded-md">
                    {specializationOptions.map((spec) => (
                      <div key={spec} className="flex items-center space-x-2">
                        <Checkbox
                          id={spec}
                          checked={(watchedValues.specialization || []).includes(spec)}
                          onCheckedChange={() => toggleArrayValue("specialization", spec)}
                        />
                        <Label
                          htmlFor={spec}
                          className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {spec}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {errors.specialization && (
                    <p className="text-sm text-destructive">{errors.specialization.message}</p>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <CardTitle className="text-xl mb-2">Teaching Subjects</CardTitle>
                  <CardDescription>What subjects do you teach or plan to teach?</CardDescription>
                </div>

                <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto p-2 border rounded-md">
                  {teachingSubjectOptions.map((subject) => (
                    <div key={subject} className="flex items-center space-x-2">
                      <Checkbox
                        id={subject}
                        checked={(watchedValues.teachingSubjects || []).includes(subject)}
                        onCheckedChange={() => toggleArrayValue("teachingSubjects", subject)}
                      />
                      <Label
                        htmlFor={subject}
                        className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {subject}
                      </Label>
                    </div>
                  ))}
                </div>
                {errors.teachingSubjects && (
                  <p className="text-sm text-destructive">{errors.teachingSubjects.message}</p>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <CardTitle className="text-xl mb-2">Qualifications</CardTitle>
                  <CardDescription>Select your academic and professional qualifications</CardDescription>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {qualificationOptions.map((qual) => (
                    <div key={qual} className="flex items-center space-x-2">
                      <Checkbox
                        id={qual}
                        checked={(watchedValues.qualifications || []).includes(qual)}
                        onCheckedChange={() => toggleArrayValue("qualifications", qual)}
                      />
                      <Label
                        htmlFor={qual}
                        className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {qual}
                      </Label>
                    </div>
                  ))}
                </div>
                {errors.qualifications && (
                  <p className="text-sm text-destructive">{errors.qualifications.message}</p>
                )}

                <div className="space-y-2">
                  <Label>Teaching Methods * (Select at least 1)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {teachingMethodOptions.map((method) => (
                      <div key={method} className="flex items-center space-x-2">
                        <Checkbox
                          id={method}
                          checked={(watchedValues.teachingMethods || []).includes(method)}
                          onCheckedChange={() => toggleArrayValue("teachingMethods", method)}
                        />
                        <Label
                          htmlFor={method}
                          className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {method}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {errors.teachingMethods && (
                    <p className="text-sm text-destructive">{errors.teachingMethods.message}</p>
                  )}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <CardTitle className="text-xl mb-2">About You</CardTitle>
                  <CardDescription>Write a brief bio to introduce yourself to students</CardDescription>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Professional Bio *</Label>
                  <Textarea
                    id="bio"
                    placeholder="Share your teaching philosophy, experience, and what makes you passionate about education..."
                    rows={6}
                    {...register("bio")}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{errors.bio?.message || "Minimum 10 characters"}</span>
                    <span>{watchedValues.bio?.length || 0}/500</span>
                  </div>
                </div>
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
