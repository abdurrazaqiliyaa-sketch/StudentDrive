import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Upload } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { CourseCombobox } from "@/components/ui/course-combobox";
import type { Course } from "@shared/schema";

const materialSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  materialType: z.enum(["lecture_notes", "textbook", "study_guide", "past_questions"]),
  courseId: z.string().min(1, "Please select a course"),
});

type MaterialFormValues = z.infer<typeof materialSchema>;

export default function UploadMaterial() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      title: "",
      description: "",
      materialType: "lecture_notes",
      courseId: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: MaterialFormValues) => {
      if (!selectedFile) {
        throw new Error("Please select a file to upload");
      }

      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'File upload failed');
        }

        const fileData = await response.json();
        
        return await apiRequest("POST", "/api/materials", {
          ...data,
          fileUrl: fileData.fileUrl,
          fileType: fileData.fileType,
          fileSize: fileData.fileSize,
          originalFilename: fileData.originalFilename,
        });
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/materials/my-library"] });
      toast({
        title: "Success",
        description: "Material uploaded successfully and is pending approval",
      });
      navigate("/my-library");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to upload material",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MaterialFormValues) => {
    createMutation.mutate(data);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "File size must be less than 10MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate("/student/dashboard")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Upload Study Material</CardTitle>
          <CardDescription>
            Share your study materials with other students. Your institution and programme will be automatically captured from your profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Introduction to Programming Notes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide a brief description of the material..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Describe what this material covers and how it might help other students
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="materialType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select material type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="lecture_notes">Lecture Notes</SelectItem>
                        <SelectItem value="textbook">Textbook</SelectItem>
                        <SelectItem value="study_guide">Study Guide</SelectItem>
                        <SelectItem value="past_questions">Past Questions</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <FormControl>
                      <CourseCombobox
                        courses={courses}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select a course"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Upload File</FormLabel>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="max-w-xs mx-auto"
                  />
                  {selectedFile && (
                    <p className="mt-4 text-sm text-gray-600">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    Supported formats: PDF, DOC, DOCX, PPT, PPTX, TXT, JPG, PNG (Max 10MB)
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || isUploading || !selectedFile}
                  className="flex-1"
                >
                  {isUploading ? "Uploading..." : createMutation.isPending ? "Submitting..." : "Upload Material"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/my-library")}
                  disabled={createMutation.isPending || isUploading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
