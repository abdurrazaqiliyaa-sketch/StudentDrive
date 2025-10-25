import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, FileText, Edit, Trash2, Download } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Material, Course } from "@shared/schema";

export default function MyLibrary() {
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [deletingMaterialId, setDeletingMaterialId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    fileUrl: "",
    fileType: "pdf",
    materialType: "lecture_notes",
    courseId: "",
    level: "",
    semester: "",
    topic: "",
    tags: "",
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: materials, isLoading } = useQuery<Material[]>({
    queryKey: ["/api/materials/my-library"],
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when reconnecting
    staleTime: 10000, // Data is fresh for 10 seconds
  });

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest("PUT", `/api/materials/${id}`, {
        ...data,
        level: data.level ? parseInt(data.level) : null,
        semester: data.semester ? parseInt(data.semester) : null,
        tags: data.tags ? data.tags.split(",").map((t: string) => t.trim()) : [],
        courseId: data.courseId || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials/my-library"] });
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      setEditingMaterial(null);
      toast({
        title: "Success",
        description: "Material updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update material",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/materials/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials/my-library"] });
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      setDeletingMaterialId(null);
      toast({
        title: "Success",
        description: "Material deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete material",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setSelectedFile(null);
    setEditForm({
      title: material.title,
      description: material.description || "",
      fileUrl: material.fileUrl || "",
      fileType: material.fileType || "pdf",
      materialType: material.materialType,
      courseId: material.courseId || "none",
      level: material.level?.toString() || "none",
      semester: material.semester?.toString() || "none",
      topic: material.topic || "",
      tags: Array.isArray(material.tags) ? material.tags.join(", ") : "",
    });
  };

  const handleUpdate = async () => {
    if (!editingMaterial) return;
    
    setIsUploading(true);
    try {
      let updatedData = { ...editForm };
      
      if (selectedFile) {
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
        updatedData.fileUrl = fileData.fileUrl;
        updatedData.fileType = fileData.fileType || editForm.fileType;
      }
      
      // Convert "none" values back to null/empty for optional fields
      const dataToSend = {
        ...updatedData,
        courseId: updatedData.courseId === "none" ? null : updatedData.courseId,
        level: updatedData.level === "none" ? null : parseInt(updatedData.level),
        semester: updatedData.semester === "none" ? null : parseInt(updatedData.semester),
        tags: updatedData.tags ? updatedData.tags.split(",").map(t => t.trim()) : [],
      };
      
      updateMutation.mutate({ id: editingMaterial.id, data: dataToSend });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeletingMaterialId(id);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-section font-heading text-foreground mb-2">
          My Library
        </h1>
        <p className="text-muted-foreground">
          Manage your uploaded study materials and resources
        </p>
      </div>

      {/* Materials Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : materials && materials.length > 0 ? (
          materials.map((material: any) => (
            <Card key={material.id} className="hover-elevate active-elevate-2">
              <CardContent className="p-6">
                <div className="h-32 bg-primary/10 rounded-md flex items-center justify-center mb-4">
                  <FileText className="h-12 w-12 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                  {material.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {material.description || "No description available"}
                </p>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Badge variant="secondary" className="text-xs">
                    {material.fileType?.toUpperCase() || "PDF"}
                  </Badge>
                  {material.materialType && (
                    <Badge variant="outline" className="text-xs">
                      {material.materialType.replace(/_/g, " ")}
                    </Badge>
                  )}
                  {material.level && (
                    <Badge variant="outline" className="text-xs">
                      {material.level} Level
                    </Badge>
                  )}
                  {material.semester && (
                    <Badge variant="outline" className="text-xs">
                      Sem {material.semester}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" size="sm" asChild>
                    <a href={material.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(material)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(material.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">No materials uploaded yet</p>
            <p className="text-sm">Upload your first material from the Resources page</p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingMaterial} onOpenChange={(open) => !open && setEditingMaterial(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Material</DialogTitle>
            <DialogDescription>
              Update your learning material information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-materialType">Material Type *</Label>
              <Select value={editForm.materialType} onValueChange={(value) => setEditForm({ ...editForm, materialType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lecture_notes">Lecture Notes</SelectItem>
                  <SelectItem value="textbook">Textbook</SelectItem>
                  <SelectItem value="study_guide">Study Guide</SelectItem>
                  <SelectItem value="past_questions">Past Questions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-file">Replace File (Optional, Max 10MB)</Label>
              <Input
                id="edit-file"
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
                    setEditForm({ ...editForm, fileType: ext });
                  }
                }}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  New file: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
              {!selectedFile && editForm.fileUrl && (
                <p className="text-sm text-muted-foreground mt-1">
                  Current file: {editForm.fileUrl}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-level">Level</Label>
                <Select value={editForm.level} onValueChange={(value) => setEditForm({ ...editForm, level: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="100">100 Level</SelectItem>
                    <SelectItem value="200">200 Level</SelectItem>
                    <SelectItem value="300">300 Level</SelectItem>
                    <SelectItem value="400">400 Level</SelectItem>
                    <SelectItem value="500">500 Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-semester">Semester</Label>
                <Select value={editForm.semester} onValueChange={(value) => setEditForm({ ...editForm, semester: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="1">1st Semester</SelectItem>
                    <SelectItem value="2">2nd Semester</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-course">Course</Label>
              <Select value={editForm.courseId} onValueChange={(value) => setEditForm({ ...editForm, courseId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {courses?.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-topic">Topic</Label>
              <Input
                id="edit-topic"
                value={editForm.topic}
                onChange={(e) => setEditForm({ ...editForm, topic: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
              <Input
                id="edit-tags"
                value={editForm.tags}
                onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMaterial(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={!editForm.title || !editForm.materialType || isUploading}>
              {isUploading ? "Updating..." : "Update Material"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingMaterialId} onOpenChange={(open) => !open && setDeletingMaterialId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Material</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this material? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingMaterialId && deleteMutation.mutate(deletingMaterialId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
