import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Upload, Download, Trash2, Edit } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Course } from "@shared/schema";

export default function InstitutionCourses() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBulkUploadDialog, setShowBulkUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [bulkData, setBulkData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    code: "",
  });

  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof courseForm) => {
      return await apiRequest("POST", "/api/courses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Success",
        description: "Course created successfully",
      });
      setShowCreateDialog(false);
      setCourseForm({ title: "", description: "", code: "" });
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
        description: error.message || "Failed to create course",
        variant: "destructive",
      });
    },
  });

  const bulkUploadMutation = useMutation({
    mutationFn: async (courses: any[]) => {
      return await apiRequest("POST", "/api/courses/bulk", { courses });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Success",
        description: `${bulkData.length} courses uploaded successfully`,
      });
      setShowBulkUploadDialog(false);
      setSelectedFile(null);
      setBulkData([]);
      setShowPreview(false);
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
        description: error.message || "Failed to upload courses",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const fileType = file.name.split('.').pop()?.toLowerCase();

    try {
      const text = await file.text();
      let parsedData: any[] = [];

      if (fileType === 'json') {
        parsedData = JSON.parse(text);
      } else if (fileType === 'csv') {
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        
        parsedData = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = values[index] || '';
          });
          return obj;
        });
      } else {
        throw new Error('Unsupported file type. Please upload CSV or JSON file.');
      }

      if (!Array.isArray(parsedData)) {
        throw new Error('Invalid format. Expected an array of courses.');
      }

      const validatedCourses = parsedData.map((course, index) => {
        if (!course.title) {
          throw new Error(`Row ${index + 1}: Course title is required`);
        }
        return {
          title: course.title,
          description: course.description || '',
          code: course.code || '',
        };
      });

      setBulkData(validatedCourses);
      setShowPreview(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to parse file",
        variant: "destructive",
      });
      setSelectedFile(null);
    }
  };

  const downloadTemplate = (format: 'csv' | 'json') => {
    const sampleData = [
      { title: "Introduction to Computer Science", description: "Basics of programming and algorithms", code: "CS101" },
      { title: "Data Structures", description: "Arrays, linked lists, trees, and graphs", code: "CS201" },
      { title: "Web Development", description: "HTML, CSS, JavaScript fundamentals", code: "WEB101" },
    ];

    let content = '';
    let filename = '';
    let type = '';

    if (format === 'json') {
      content = JSON.stringify(sampleData, null, 2);
      filename = 'courses-template.json';
      type = 'application/json';
    } else {
      const headers = 'title,description,code\n';
      const rows = sampleData.map(c => `"${c.title}","${c.description}","${c.code}"`).join('\n');
      content = headers + rows;
      filename = 'courses-template.csv';
      type = 'text/csv';
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-section font-heading text-foreground mb-2">
          Course Management
        </h1>
        <p className="text-muted-foreground">
          Manage courses for your institution
        </p>
      </div>

      <div className="flex gap-4">
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Course
        </Button>
        <Button variant="outline" onClick={() => setShowBulkUploadDialog(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Bulk Upload
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Courses</CardTitle>
          <CardDescription>
            {courses?.length || 0} courses available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : courses && courses.length > 0 ? (
                courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-mono">
                      <Badge variant="outline">{course.code || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{course.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {course.description || 'No description'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No courses found. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Course Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
            <DialogDescription>
              Add a new course to your institution
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="code">Course Code *</Label>
              <Input
                id="code"
                value={courseForm.code}
                onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                placeholder="e.g., CS101"
              />
            </div>
            <div>
              <Label htmlFor="title">Course Title *</Label>
              <Input
                id="title"
                value={courseForm.title}
                onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                placeholder="e.g., Introduction to Computer Science"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                placeholder="Brief course description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(courseForm)}
              disabled={!courseForm.title || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={showBulkUploadDialog} onOpenChange={(open) => {
        setShowBulkUploadDialog(open);
        if (!open) {
          setSelectedFile(null);
          setBulkData([]);
          setShowPreview(false);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Upload Courses</DialogTitle>
            <DialogDescription>
              Upload multiple courses at once using CSV or JSON format
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload File</TabsTrigger>
              <TabsTrigger value="templates">Download Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <Label htmlFor="bulk-file" className="cursor-pointer">
                  <div className="text-sm font-medium mb-2">
                    Click to upload or drag and drop
                  </div>
                  <div className="text-xs text-muted-foreground mb-4">
                    CSV or JSON file (max 5MB)
                  </div>
                  <Input
                    id="bulk-file"
                    type="file"
                    accept=".csv,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button variant="outline" type="button">
                    Select File
                  </Button>
                </Label>
                {selectedFile && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    Selected: {selectedFile.name}
                  </div>
                )}
              </div>

              {showPreview && bulkData.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">
                      Preview ({bulkData.length} courses)
                    </h3>
                    <Badge>{bulkData.length} courses ready</Badge>
                  </div>
                  <div className="border rounded-lg max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bulkData.map((course, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-xs">
                              {course.code || 'N/A'}
                            </TableCell>
                            <TableCell className="font-medium">{course.title}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {course.description || 'No description'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Download a template file to see the required format for bulk uploads
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="hover:bg-accent cursor-pointer" onClick={() => downloadTemplate('csv')}>
                    <CardContent className="p-6 flex items-center space-x-4">
                      <Download className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <div className="font-medium">CSV Template</div>
                        <div className="text-xs text-muted-foreground">
                          Download CSV format
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="hover:bg-accent cursor-pointer" onClick={() => downloadTemplate('json')}>
                    <CardContent className="p-6 flex items-center space-x-4">
                      <Download className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <div className="font-medium">JSON Template</div>
                        <div className="text-xs text-muted-foreground">
                          Download JSON format
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2 text-sm">Required Fields:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• <strong>title</strong> (required) - Course name</li>
                    <li>• <strong>code</strong> (optional) - Course code (e.g., CS101)</li>
                    <li>• <strong>description</strong> (optional) - Course description</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowBulkUploadDialog(false);
              setSelectedFile(null);
              setBulkData([]);
              setShowPreview(false);
            }}>
              Cancel
            </Button>
            <Button
              onClick={() => bulkUploadMutation.mutate(bulkData)}
              disabled={bulkData.length === 0 || bulkUploadMutation.isPending}
            >
              {bulkUploadMutation.isPending ? "Uploading..." : `Upload ${bulkData.length} Courses`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
