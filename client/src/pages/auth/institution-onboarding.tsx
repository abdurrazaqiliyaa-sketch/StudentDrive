import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

const institutionOnboardingSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  institutionName: z.string().min(2, "Institution name is required"),
  institutionType: z.string().min(1, "Institution type is required"),
  numberOfStudents: z.number().min(1, "Number of students is required"),
  departments: z.array(z.string()).min(1, "Please select at least 1 department"),
  institutionAddress: z.string().min(5, "Address is required"),
  institutionPhone: z.string().min(10, "Valid phone number is required"),
  bio: z.string().min(20, "Please provide a description of your institution (minimum 20 characters)").max(1000, "Description must be less than 1000 characters"),
});

type InstitutionOnboardingForm = z.infer<typeof institutionOnboardingSchema>;

const institutionTypeOptions = [
  "University",
  "College",
  "Technical Institute",
  "Vocational School",
  "Online Academy",
  "Training Center",
  "Corporate Training",
  "Other",
];

const departmentOptions = [
  "Computer Science",
  "Software Engineering",
  "Information Technology",
  "Data Science",
  "Cyber Security",
  "Engineering",
  "Business Administration",
  "Mathematics",
  "Sciences",
  "Arts & Humanities",
  "Social Sciences",
  "Other",
];

const studentRanges = [
  { value: 50, label: "1-50 students" },
  { value: 200, label: "50-200 students" },
  { value: 500, label: "200-500 students" },
  { value: 1000, label: "500-1,000 students" },
  { value: 5000, label: "1,000-5,000 students" },
  { value: 10000, label: "5,000+ students" },
];

interface InstitutionOnboardingProps {
  onComplete: () => void;
}

export default function InstitutionOnboarding({ onComplete }: InstitutionOnboardingProps) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<InstitutionOnboardingForm>({
    resolver: zodResolver(institutionOnboardingSchema),
    defaultValues: {
      departments: [],
    },
  });

  const watchedValues = watch();
  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const toggleArrayValue = (field: "departments", value: string) => {
    const currentValues = watchedValues[field] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];
    setValue(field, newValues);
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof InstitutionOnboardingForm)[] = [];

    if (step === 1) {
      fieldsToValidate = ["firstName", "lastName"];
    } else if (step === 2) {
      fieldsToValidate = ["institutionName", "institutionType", "numberOfStudents"];
    } else if (step === 3) {
      fieldsToValidate = ["departments", "institutionAddress", "institutionPhone"];
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

  const onSubmit = async (data: InstitutionOnboardingForm) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "institution",
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
            <CardTitle className="text-3xl">Welcome to StudentDrive!</CardTitle>
            <CardDescription className="text-lg">
              Your institution profile is complete. You're ready to manage your educational organization.
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
            <Building2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            <span className="text-2xl font-heading font-bold">Institution Setup</span>
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
                  <CardTitle className="text-xl mb-2">Contact Person</CardTitle>
                  <CardDescription>Who will be the primary contact for this institution?</CardDescription>
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
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <CardTitle className="text-xl mb-2">Institution Information</CardTitle>
                  <CardDescription>Tell us about your educational institution</CardDescription>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="institutionName">Institution Name *</Label>
                  <Input
                    id="institutionName"
                    placeholder="e.g., Tech University"
                    {...register("institutionName")}
                  />
                  {errors.institutionName && (
                    <p className="text-sm text-destructive">{errors.institutionName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="institutionType">Institution Type *</Label>
                  <Select onValueChange={(value) => setValue("institutionType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select institution type" />
                    </SelectTrigger>
                    <SelectContent>
                      {institutionTypeOptions.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.institutionType && (
                    <p className="text-sm text-destructive">{errors.institutionType.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numberOfStudents">Number of Students *</Label>
                  <Select onValueChange={(value) => setValue("numberOfStudents", parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select student range" />
                    </SelectTrigger>
                    <SelectContent>
                      {studentRanges.map((range) => (
                        <SelectItem key={range.value} value={range.value.toString()}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.numberOfStudents && (
                    <p className="text-sm text-destructive">{errors.numberOfStudents.message}</p>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <CardTitle className="text-xl mb-2">Departments & Contact</CardTitle>
                  <CardDescription>Select departments and provide contact information</CardDescription>
                </div>

                <div className="space-y-2">
                  <Label>Departments * (Select at least 1)</Label>
                  <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2 border rounded-md">
                    {departmentOptions.map((dept) => (
                      <div key={dept} className="flex items-center space-x-2">
                        <Checkbox
                          id={dept}
                          checked={(watchedValues.departments || []).includes(dept)}
                          onCheckedChange={() => toggleArrayValue("departments", dept)}
                        />
                        <Label
                          htmlFor={dept}
                          className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {dept}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {errors.departments && (
                    <p className="text-sm text-destructive">{errors.departments.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="institutionAddress">Institution Address *</Label>
                  <Textarea
                    id="institutionAddress"
                    placeholder="Enter full address of your institution"
                    rows={3}
                    {...register("institutionAddress")}
                  />
                  {errors.institutionAddress && (
                    <p className="text-sm text-destructive">{errors.institutionAddress.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="institutionPhone">Phone Number *</Label>
                  <Input
                    id="institutionPhone"
                    placeholder="+1 (555) 123-4567"
                    {...register("institutionPhone")}
                  />
                  {errors.institutionPhone && (
                    <p className="text-sm text-destructive">{errors.institutionPhone.message}</p>
                  )}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <CardTitle className="text-xl mb-2">About Your Institution</CardTitle>
                  <CardDescription>Provide a description of your institution for students and instructors</CardDescription>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Institution Description *</Label>
                  <Textarea
                    id="bio"
                    placeholder="Describe your institution's mission, values, programs, and what makes it unique..."
                    rows={8}
                    {...register("bio")}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{errors.bio?.message || "Minimum 20 characters"}</span>
                    <span>{watchedValues.bio?.length || 0}/1000</span>
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
