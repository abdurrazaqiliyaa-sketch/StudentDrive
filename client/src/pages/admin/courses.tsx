import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Plus,
  Upload,
  FileJson,
  FileSpreadsheet,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { Course, Institution } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CoursesManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    code: "",
    institutionId: "",
  });
  const [bulkData, setBulkData] = useState("");
  const [bulkFormat, setBulkFormat] = useState<"json" | "csv">("json");

  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: institutions } = useQuery<Institution[]>({
    queryKey: ["/api/admin/institutions"],
  });

  const createCourseMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      code?: string;
      institutionId?: string;
    }) => {
      await apiRequest("POST", "/api/courses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Success",
        description: "Course created successfully",
      });
      setIsCourseDialogOpen(false);
      setNewCourse({ title: "", description: "", code: "", institutionId: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create course",
        variant: "destructive",
      });
    },
  });

  const bulkUploadMutation = useMutation({
    mutationFn: async (data: { courses: any[] }) => {
      const response = await fetch("/api/courses/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload courses");
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Success",
        description: data.message || `${data.added} courses added successfully`,
      });
      setIsBulkUploadDialogOpen(false);
      setBulkData("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload courses",
        variant: "destructive",
      });
    },
  });

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.title.trim()) {
      toast({
        title: "Error",
        description: "Course title is required",
        variant: "destructive",
      });
      return;
    }

    createCourseMutation.mutate({
      title: newCourse.title,
      description: newCourse.description || "",
      code: newCourse.code || undefined,
      institutionId: newCourse.institutionId || undefined,
    });
  };

  const handleBulkUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkData.trim()) {
      toast({
        title: "Error",
        description: "Please provide data to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      let coursesData;
      if (bulkFormat === "json") {
        coursesData = JSON.parse(bulkData);
        if (!Array.isArray(coursesData)) {
          throw new Error("JSON data must be an array");
        }
      } else {
        const lines = bulkData.trim().split("\n");
        const headers = lines[0].split(",").map((h) => h.trim());
        coursesData = lines.slice(1).map((line) => {
          const values = line.split(",").map((v) => v.trim());
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = values[index] || undefined;
          });
          return obj;
        });
      }

      bulkUploadMutation.mutate({ courses: coursesData });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Invalid ${bulkFormat.toUpperCase()} format: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const getInstitutionName = (institutionId: string | null) => {
    if (!institutionId) return "N/A";
    const institution = institutions?.find((i) => i.id === institutionId);
    return institution?.name || "Unknown";
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-section font-heading text-foreground mb-2">
          Course Management
        </h1>
        <p className="text-muted-foreground">
          Add and manage courses available for institutions
        </p>
      </div>

      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="courses">All Courses</TabsTrigger>
          <TabsTrigger value="add">Add Course</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-role-admin" />
                    All Courses
                  </CardTitle>
                  <CardDescription>
                    {courses?.length || 0} total courses
                  </CardDescription>
                </div>
                <Dialog
                  open={isCourseDialogOpen}
                  onOpenChange={setIsCourseDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Course
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleCreateCourse}>
                      <DialogHeader>
                        <DialogTitle>Add New Course</DialogTitle>
                        <DialogDescription>
                          Create a new course that institutions can offer
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Course Title *</Label>
                          <Input
                            id="title"
                            value={newCourse.title}
                            onChange={(e) =>
                              setNewCourse({ ...newCourse, title: e.target.value })
                            }
                            placeholder="e.g., Introduction to Computer Science"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="code">Course Code</Label>
                          <Input
                            id="code"
                            value={newCourse.code}
                            onChange={(e) =>
                              setNewCourse({ ...newCourse, code: e.target.value })
                            }
                            placeholder="e.g., CS101"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={newCourse.description}
                            onChange={(e) =>
                              setNewCourse({
                                ...newCourse,
                                description: e.target.value,
                              })
                            }
                            placeholder="Course description..."
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="institution">Institution (Optional)</Label>
                          <Select
                            value={newCourse.institutionId || "none"}
                            onValueChange={(value) =>
                              setNewCourse({ ...newCourse, institutionId: value === "none" ? "" : value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select institution (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {institutions?.map((institution) => (
                                <SelectItem key={institution.id} value={institution.id}>
                                  {institution.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="submit"
                          disabled={createCourseMutation.isPending}
                        >
                          {createCourseMutation.isPending
                            ? "Creating..."
                            : "Create Course"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !courses || courses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No courses found. Add your first course to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course Title</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Institution</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">
                          {course.title}
                        </TableCell>
                        <TableCell>{course.code || "N/A"}</TableCell>
                        <TableCell className="max-w-md truncate">
                          {course.description || "No description"}
                        </TableCell>
                        <TableCell>
                          {getInstitutionName(course.institutionId)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New Course</CardTitle>
              <CardDescription>
                Create a new course that institutions can offer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title-form">Course Title *</Label>
                  <Input
                    id="title-form"
                    value={newCourse.title}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, title: e.target.value })
                    }
                    placeholder="e.g., Introduction to Computer Science"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code-form">Course Code</Label>
                  <Input
                    id="code-form"
                    value={newCourse.code}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, code: e.target.value })
                    }
                    placeholder="e.g., CS101"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description-form">Description</Label>
                  <Textarea
                    id="description-form"
                    value={newCourse.description}
                    onChange={(e) =>
                      setNewCourse({
                        ...newCourse,
                        description: e.target.value,
                      })
                    }
                    placeholder="Course description..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="institution-form">Institution (Optional)</Label>
                  <Select
                    value={newCourse.institutionId || "none"}
                    onValueChange={(value) =>
                      setNewCourse({ ...newCourse, institutionId: value === "none" ? "" : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select institution (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {institutions?.map((institution) => (
                        <SelectItem key={institution.id} value={institution.id}>
                          {institution.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="submit"
                  disabled={createCourseMutation.isPending}
                  className="w-full"
                >
                  {createCourseMutation.isPending
                    ? "Creating..."
                    : "Create Course"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Bulk Upload Courses
              </CardTitle>
              <CardDescription>
                Upload multiple courses at once using JSON or CSV format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBulkUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label>Format</Label>
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant={bulkFormat === "json" ? "default" : "outline"}
                      onClick={() => setBulkFormat("json")}
                      className="flex-1"
                    >
                      <FileJson className="mr-2 h-4 w-4" />
                      JSON
                    </Button>
                    <Button
                      type="button"
                      variant={bulkFormat === "csv" ? "default" : "outline"}
                      onClick={() => setBulkFormat("csv")}
                      className="flex-1"
                    >
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      CSV
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Data</Label>
                  <Textarea
                    value={bulkData}
                    onChange={(e) => setBulkData(e.target.value)}
                    placeholder={
                      bulkFormat === "json"
                        ? `[\n  {\n    "title": "Course Title",\n    "code": "CS101",\n    "description": "Course description",\n    "institutionId": "optional-id"\n  }\n]`
                        : `title,code,description,institutionId\nCourse Title,CS101,Course description,optional-id`
                    }
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <p className="text-sm font-medium">Format Guidelines:</p>
                  {bulkFormat === "json" ? (
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>
                        Provide an array of course objects
                      </li>
                      <li>
                        Required field: <code className="text-xs">title</code>
                      </li>
                      <li>
                        Optional fields: <code className="text-xs">code</code>,{" "}
                        <code className="text-xs">description</code>,{" "}
                        <code className="text-xs">institutionId</code>
                      </li>
                    </ul>
                  ) : (
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>First row must be headers</li>
                      <li>
                        Required column: <code className="text-xs">title</code>
                      </li>
                      <li>
                        Optional columns: <code className="text-xs">code</code>,{" "}
                        <code className="text-xs">description</code>,{" "}
                        <code className="text-xs">institutionId</code>
                      </li>
                      <li>Separate values with commas</li>
                    </ul>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={bulkUploadMutation.isPending}
                  className="w-full"
                >
                  {bulkUploadMutation.isPending
                    ? "Uploading..."
                    : "Upload Courses"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
