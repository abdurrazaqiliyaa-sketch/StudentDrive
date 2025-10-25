import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import type { Institution, Programme } from "@shared/schema";
import { User, Lock, Info, CheckCircle2, XCircle, Calendar, Mail } from "lucide-react";

// Validation schemas
const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name is too long"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name is too long"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function Settings() {
  const { user, isStudent } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch institution data for students
  const { data: institution } = useQuery<Institution>({
    queryKey: [`/api/institutions/${user?.institutionId}`],
    enabled: !!user?.institutionId && user.institutionId !== "no-institution",
    retry: false,
  });

  // Fetch programme data for students
  const { data: programme } = useQuery<Programme>({
    queryKey: [`/api/programmes/single/${user?.programmeId}`],
    enabled: !!user?.programmeId,
    retry: false,
  });

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to change password");
      }

      return response.json();
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({
        title: "Success",
        description: "Password changed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const handlePasswordSubmit = (data: PasswordFormData) => {
    changePasswordMutation.mutate(data);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-section font-heading text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2">
            <Info className="h-4 w-4" />
            Account
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4 mt-6">
          <Card className="hover-elevate">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">
                      First Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      {...profileForm.register("firstName")}
                      placeholder="Enter your first name"
                    />
                    {profileForm.formState.errors.firstName && (
                      <p className="text-xs text-destructive">
                        {profileForm.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">
                      Last Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      {...profileForm.register("lastName")}
                      placeholder="Enter your last name"
                    />
                    {profileForm.formState.errors.lastName && (
                      <p className="text-xs text-destructive">
                        {profileForm.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="flex gap-2 items-center">
                      <Input id="email" value={user?.email || ""} disabled className="flex-1" />
                      {user?.emailVerified ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Not Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input 
                      id="role" 
                      value={user?.role || ""} 
                      disabled 
                      className="capitalize" 
                    />
                    <p className="text-xs text-muted-foreground">Role cannot be changed</p>
                  </div>

                  {isStudent && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="institution">Institution</Label>
                        <Input 
                          id="institution" 
                          value={
                            !user?.institutionId 
                              ? "No institution" 
                              : user.institutionId === "no-institution" 
                                ? "No institution" 
                                : institution?.name || "Loading..."
                          } 
                          disabled 
                        />
                        <p className="text-xs text-muted-foreground">Institution cannot be changed</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="programme">Programme</Label>
                        <Input 
                          id="programme" 
                          value={
                            !user?.programmeId 
                              ? "No programme" 
                              : programme?.name || "Loading..."
                          } 
                          disabled 
                        />
                        <p className="text-xs text-muted-foreground">Programme cannot be changed</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending || !profileForm.formState.isDirty}
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4 mt-6">
          <Card className="hover-elevate">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">
                    Current Password <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    {...passwordForm.register("currentPassword")}
                    placeholder="Enter your current password"
                  />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-xs text-destructive">
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="newPassword">
                    New Password <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    {...passwordForm.register("newPassword")}
                    placeholder="Enter your new password"
                  />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-xs text-destructive">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 8 characters long
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Confirm New Password <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...passwordForm.register("confirmPassword")}
                    placeholder="Confirm your new password"
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-destructive">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={changePasswordMutation.isPending}
                  >
                    {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="hover-elevate border-orange-200 dark:border-orange-900">
            <CardHeader>
              <CardTitle className="text-orange-600 dark:text-orange-500">Security Tips</CardTitle>
              <CardDescription>Keep your account safe with these recommendations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Use a strong password with a mix of letters, numbers, and symbols</li>
                <li>Don't reuse passwords from other websites</li>
                <li>Change your password regularly</li>
                <li>Never share your password with anyone</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-4 mt-6">
          <Card className="hover-elevate">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>View your account details and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <Label>Email Address</Label>
                  </div>
                  <p className="text-sm font-medium">{user?.email || "N/A"}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                    <Label>Email Verified</Label>
                  </div>
                  <div>
                    {user?.emailVerified ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Yes
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        No
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <Label>Account Created</Label>
                  </div>
                  <p className="text-sm font-medium">
                    {user?.createdAt 
                      ? new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : "N/A"}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <Label>Account Role</Label>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {user?.role || "N/A"}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-muted-foreground">Account ID</Label>
                <p className="text-xs font-mono bg-muted p-2 rounded">{user?.id || "N/A"}</p>
              </div>

              {isStudent && (user?.institutionId || user?.programmeId) && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold">Academic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {user?.institutionId && user.institutionId !== "no-institution" && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Institution</Label>
                          <p className="text-sm">{institution?.name || "Loading..."}</p>
                        </div>
                      )}
                      {user?.programmeId && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Programme</Label>
                          <p className="text-sm">{programme?.name || "Loading..."}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
