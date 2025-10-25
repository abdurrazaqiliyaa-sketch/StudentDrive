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
} from "@/components/ui/form";
import { ArrowLeft } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { CourseCombobox } from "@/components/ui/course-combobox";
import type { Course } from "@shared/schema";

const materialSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  fileType: z.string().min(1, "File type is required"),
  courseId: z.string().optional(),
  tags: z.string().optional(),
});

type MaterialFormValues = z.infer<typeof materialSchema>;

export default function CreateMaterial() {
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
      fileType: "pdf",
      courseId: "",
      tags: "",
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
        const tags = data.tags ? data.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
        
        return await apiRequest("POST", "/api/materials", {
          ...data,
          fileUrl: fileData.fileUrl,
          fileType: fileData.fileType || data.fileType,
          fileSize: fileData.fileSize,
          originalFilename: fileData.originalFilename,
          tags,
          materialType: "lecture_notes",
        });
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/instructor/materials"] });
      toast({
        title: "Success",
        description: "Material created successfully",
      });
      navigate("/instructor/materials");
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
        description: error.message || "Failed to create material",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MaterialFormValues) => {
    createMutation.mutate(data);
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/instructor/materials")}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Materials
        </Button>
        <h1 className="text-section font-heading text-foreground mb-2">
          Upload New Material
        </h1>
        <p className="text-muted-foreground">
          Share educational resources with your students
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Material Details</CardTitle>
          <CardDescription>Fill in the information about your educational material</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Introduction to Calculus" {...field} data-testid="input-title" />
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
                        placeholder="Describe the material..."
                        {...field}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Upload File (Max 10MB)</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          toast({
                            title: "Error",
                            description: "File size must be less than 10MB",
                            variant: "destructive",
                          });
                          e.target.value = '';
                          return;
                        }
                        setSelectedFile(file);
                        const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
                        form.setValue('fileType', ext);
                      }
                    }}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                    data-testid="input-file"
                  />
                </FormControl>
                {selectedFile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                <FormMessage />
              </FormItem>

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="fileType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File Type (Auto-detected)</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly data-testid="input-file-type" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course (Optional)</FormLabel>
                      <FormControl>
                        <CourseCombobox
                          courses={courses}
                          value={field.value || ""}
                          onValueChange={field.onChange}
                          placeholder="Select a course"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (comma-separated)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="calculus, mathematics, derivatives"
                        {...field}
                        data-testid="input-tags"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/instructor/materials")}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || !selectedFile || isUploading}
                  data-testid="button-submit"
                >
                  {isUploading || createMutation.isPending ? "Uploading..." : "Create Material"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
