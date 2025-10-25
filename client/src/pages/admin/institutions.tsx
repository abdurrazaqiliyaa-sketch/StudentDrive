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
  Shield,
  Plus,
  Building2,
  GraduationCap,
  Upload,
  FileJson,
  FileSpreadsheet,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { Institution, Programme } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function InstitutionsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isInstitutionDialogOpen, setIsInstitutionDialogOpen] = useState(false);
  const [isProgrammeDialogOpen, setIsProgrammeDialogOpen] = useState(false);
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);
  const [
    isInstitutionBulkUploadDialogOpen,
    setIsInstitutionBulkUploadDialogOpen,
  ] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<string | null>(
    null,
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newInstitution, setNewInstitution] = useState({
    name: "",
    description: "",
    website: "",
  });
  const [newProgramme, setNewProgramme] = useState({
    name: "",
    code: "",
    degree: "",
    duration: "",
    description: "",
  });
  const [bulkData, setBulkData] = useState("");
  const [institutionBulkData, setInstitutionBulkData] = useState("");
  const [bulkFormat, setBulkFormat] = useState<"json" | "csv">("json");
  const [institutionBulkFormat, setInstitutionBulkFormat] = useState<
    "json" | "csv"
  >("json");

  const { data: institutions, isLoading } = useQuery<Institution[]>({
    queryKey: ["/api/admin/institutions"],
  });

  const { data: programmes } = useQuery<Programme[]>({
    queryKey: ["/api/admin/programmes", selectedInstitution],
    queryFn: async () => {
      if (!selectedInstitution) return [];
      const res = await fetch(`/api/admin/programmes/${selectedInstitution}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch programmes");
      return res.json();
    },
    enabled: !!selectedInstitution,
  });

  const createInstitutionMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      website?: string;
    }) => {
      await apiRequest("POST", "/api/admin/institutions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/institutions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Success",
        description: "Institution created successfully",
      });
      setIsInstitutionDialogOpen(false);
      setNewInstitution({ name: "", description: "", website: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create institution",
        variant: "destructive",
      });
    },
  });

  const createProgrammeMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/admin/programmes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/programmes", selectedInstitution],
      });
      toast({
        title: "Success",
        description: "Programme created successfully",
      });
      setIsProgrammeDialogOpen(false);
      setNewProgramme({
        name: "",
        code: "",
        degree: "",
        duration: "",
        description: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create programme",
        variant: "destructive",
      });
    },
  });

  const bulkUploadMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/admin/programmes/bulk", data);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/programmes", selectedInstitution],
      });
      toast({
        title: "Success",
        description: `${data.count} programmes uploaded successfully`,
      });
      setIsBulkUploadDialogOpen(false);
      setBulkData("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload programmes",
        variant: "destructive",
      });
    },
  });

  const bulkInstitutionUploadMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/institutions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to upload institutions");
      }
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/institutions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Success",
        description:
          data.message || `${data.added} institutions added successfully`,
      });
      setIsInstitutionBulkUploadDialogOpen(false);
      setInstitutionBulkData("");
      setSelectedFile(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload institutions",
        variant: "destructive",
      });
    },
  });

  const deleteProgrammeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/programmes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/programmes", selectedInstitution],
      });
      toast({
        title: "Success",
        description: "Programme deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete programme",
        variant: "destructive",
      });
    },
  });

  const handleCreateInstitution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstitution.name.trim()) {
      toast({
        title: "Error",
        description: "Institution name is required",
        variant: "destructive",
      });
      return;
    }
    createInstitutionMutation.mutate(newInstitution);
  };

  const handleCreateProgramme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstitution) {
      toast({
        title: "Error",
        description: "Please select an institution first",
        variant: "destructive",
      });
      return;
    }
    if (!newProgramme.name.trim()) {
      toast({
        title: "Error",
        description: "Programme name is required",
        variant: "destructive",
      });
      return;
    }

    createProgrammeMutation.mutate({
      institutionId: selectedInstitution,
      name: newProgramme.name,
      code: newProgramme.code || null,
      degree: newProgramme.degree || null,
      duration: newProgramme.duration ? parseInt(newProgramme.duration) : null,
      description: newProgramme.description || null,
    });
  };

  const handleBulkUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstitution) {
      toast({
        title: "Error",
        description: "Please select an institution first",
        variant: "destructive",
      });
      return;
    }
    if (!bulkData.trim()) {
      toast({
        title: "Error",
        description: "Please provide data to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      let programmesData;
      if (bulkFormat === "json") {
        programmesData = JSON.parse(bulkData);
        if (!Array.isArray(programmesData)) {
          throw new Error("JSON data must be an array");
        }
      } else {
        // Parse CSV
        const lines = bulkData.trim().split("\n");
        const headers = lines[0].split(",").map((h) => h.trim());
        programmesData = lines.slice(1).map((line) => {
          const values = line.split(",").map((v) => v.trim());
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = values[index];
          });
          return obj;
        });
      }

      bulkUploadMutation.mutate({
        institutionId: selectedInstitution,
        programmes: programmesData,
        format: bulkFormat,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Invalid ${bulkFormat.toUpperCase()} format: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleInstitutionBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    let institutionsData: any[] = [];

    try {
      if (selectedFile) {
        // Handle file upload
        const fileText = await selectedFile.text();
        if (selectedFile.name.endsWith(".json")) {
          institutionsData = JSON.parse(fileText);
        } else if (selectedFile.name.endsWith(".csv")) {
          const lines = fileText.trim().split("\n");
          const headers = lines[0].split(",").map((h) => h.trim());
          institutionsData = lines.slice(1).map((line) => {
            const values = line.split(",").map((v) => v.trim());
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = values[index] || null;
            });
            return obj;
          });
        } else {
          throw new Error("Unsupported file format. Please use JSON or CSV.");
        }
      } else if (institutionBulkData.trim()) {
        // Handle text input
        if (institutionBulkFormat === "json") {
          institutionsData = JSON.parse(institutionBulkData);
        } else {
          const lines = institutionBulkData.trim().split("\n");
          const headers = lines[0].split(",").map((h) => h.trim());
          institutionsData = lines.slice(1).map((line) => {
            const values = line.split(",").map((v) => v.trim());
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = values[index] || null;
            });
            return obj;
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Please provide data to upload or select a file",
          variant: "destructive",
        });
        return;
      }

      if (!Array.isArray(institutionsData)) {
        throw new Error("Data must be an array");
      }

      if (institutionsData.length === 0) {
        throw new Error("No institutions found in the data");
      }

      bulkInstitutionUploadMutation.mutate({ institutions: institutionsData });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Invalid format: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-section font-heading text-foreground mb-2">
            Institutions
          </h1>
          <p className="text-muted-foreground">
            Manage educational institutions and their programmes
          </p>
        </div>
        <Dialog
          open={isInstitutionDialogOpen}
          onOpenChange={setIsInstitutionDialogOpen}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Institution
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Institution</DialogTitle>
              <DialogDescription>
                Create a new educational institution on the platform
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateInstitution}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Institution Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., University of Technology"
                    value={newInstitution.name}
                    onChange={(e) =>
                      setNewInstitution({
                        ...newInstitution,
                        name: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="e.g., A leading educational institution"
                    value={newInstitution.description}
                    onChange={(e) =>
                      setNewInstitution({
                        ...newInstitution,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="e.g., https://www.university.edu"
                    value={newInstitution.website}
                    onChange={(e) =>
                      setNewInstitution({
                        ...newInstitution,
                        website: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsInstitutionDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createInstitutionMutation.isPending}
                >
                  {createInstitutionMutation.isPending
                    ? "Creating..."
                    : "Create Institution"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="institutions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="institutions">
            <Building2 className="h-4 w-4 mr-2" />
            Institutions
          </TabsTrigger>
          <TabsTrigger value="programmes" disabled={!selectedInstitution}>
            <GraduationCap className="h-4 w-4 mr-2" />
            Programmes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="institutions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-role-admin" />
                    All Institutions
                  </CardTitle>
                  <CardDescription>
                    {institutions?.length || 0} total institutions
                  </CardDescription>
                </div>
                <Dialog
                  open={isInstitutionBulkUploadDialogOpen}
                  onOpenChange={setIsInstitutionBulkUploadDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Upload className="h-4 w-4" />
                      Bulk Upload
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Bulk Upload Institutions</DialogTitle>
                      <DialogDescription>
                        Upload multiple institutions via file (JSON/CSV) or
                        paste data directly
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleInstitutionBulkUpload}>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Upload File</Label>
                          <Input
                            type="file"
                            accept=".json,.csv"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setSelectedFile(file);
                                setInstitutionBulkData("");
                              }
                            }}
                          />
                          <p className="text-sm text-muted-foreground">
                            Supported formats: JSON, CSV
                          </p>
                        </div>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                              Or paste data
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={
                              institutionBulkFormat === "json"
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => setInstitutionBulkFormat("json")}
                            className="gap-2"
                          >
                            <FileJson className="h-4 w-4" />
                            JSON Format
                          </Button>
                          <Button
                            type="button"
                            variant={
                              institutionBulkFormat === "csv"
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => setInstitutionBulkFormat("csv")}
                            className="gap-2"
                          >
                            <FileSpreadsheet className="h-4 w-4" />
                            CSV Format
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <Label>
                            {institutionBulkFormat === "json"
                              ? "JSON Data"
                              : "CSV Data"}
                          </Label>
                          <Textarea
                            value={institutionBulkData}
                            onChange={(e) => {
                              setInstitutionBulkData(e.target.value);
                              setSelectedFile(null);
                            }}
                            placeholder={
                              institutionBulkFormat === "json"
                                ? `[\n  {\n    "name": "University of Technology",\n    "description": "A leading tech university",\n    "website": "https://utech.edu"\n  }\n]`
                                : "name,description,website\nUniversity of Technology,A leading tech university,https://utech.edu"
                            }
                            rows={8}
                            className="font-mono text-sm"
                          />
                          <p className="text-sm text-muted-foreground">
                            Required fields: <strong>name</strong>. Optional:
                            description, website
                          </p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsInstitutionBulkUploadDialogOpen(false);
                            setInstitutionBulkData("");
                            setSelectedFile(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={bulkInstitutionUploadMutation.isPending}
                        >
                          {bulkInstitutionUploadMutation.isPending
                            ? "Uploading..."
                            : "Upload Institutions"}
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
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !institutions || institutions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Building2 className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p>No institutions found</p>
                  <p className="text-sm mt-2">
                    Click "Add Institution" to create one
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Institution</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Website</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {institutions.map((institution) => (
                        <TableRow
                          key={institution.id}
                          className={
                            selectedInstitution === institution.id
                              ? "bg-muted/50"
                              : ""
                          }
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-md bg-role-institution/10 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-role-institution" />
                              </div>
                              <div>
                                <p className="font-semibold">
                                  {institution.name}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {institution.description || "No description"}
                          </TableCell>
                          <TableCell>
                            {institution.website ? (
                              <a
                                href={institution.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                Visit
                              </a>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {institution.createdAt
                              ? new Date(
                                  institution.createdAt,
                                ).toLocaleDateString()
                              : "Unknown"}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant={
                                selectedInstitution === institution.id
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() =>
                                setSelectedInstitution(institution.id)
                              }
                            >
                              {selectedInstitution === institution.id
                                ? "Selected"
                                : "Manage Programmes"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="programmes">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Programmes for{" "}
                  {
                    institutions?.find((i) => i.id === selectedInstitution)
                      ?.name
                  }
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {programmes?.length || 0} programmes
                </p>
              </div>
              <div className="flex gap-2">
                <Dialog
                  open={isBulkUploadDialogOpen}
                  onOpenChange={setIsBulkUploadDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Upload className="h-4 w-4" />
                      Bulk Upload
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Bulk Upload Programmes</DialogTitle>
                      <DialogDescription>
                        Upload multiple programmes via JSON or CSV format
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleBulkUpload}>
                      <div className="space-y-4 py-4">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={
                              bulkFormat === "json" ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setBulkFormat("json")}
                            className="gap-2"
                          >
                            <FileJson className="h-4 w-4" />
                            JSON Format
                          </Button>
                          <Button
                            type="button"
                            variant={
                              bulkFormat === "csv" ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setBulkFormat("csv")}
                            className="gap-2"
                          >
                            <FileSpreadsheet className="h-4 w-4" />
                            CSV Format
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <Label>
                            {bulkFormat === "json" ? "JSON Data" : "CSV Data"}
                          </Label>
                          <Textarea
                            value={bulkData}
                            onChange={(e) => setBulkData(e.target.value)}
                            placeholder={
                              bulkFormat === "json"
                                ? `[\n  {\n    "name": "Computer Science",\n    "code": "CS",\n    "degree": "Bachelor",\n    "duration": 4,\n    "description": "Bachelor of Computer Science"\n  }\n]`
                                : `name,code,degree,duration,description\nComputer Science,CS,Bachelor,4,Bachelor of Computer Science\nBusiness Administration,BA,Bachelor,4,Bachelor of Business Administration`
                            }
                            className="font-mono text-sm min-h-[200px]"
                          />
                        </div>

                        <div className="rounded-md bg-muted p-4 text-sm">
                          <p className="font-medium mb-2">Format Guidelines:</p>
                          {bulkFormat === "json" ? (
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                              <li>Must be a valid JSON array</li>
                              <li>
                                Required field:{" "}
                                <code className="bg-background px-1 rounded">
                                  name
                                </code>
                              </li>
                              <li>
                                Optional fields:{" "}
                                <code className="bg-background px-1 rounded">
                                  code
                                </code>
                                ,{" "}
                                <code className="bg-background px-1 rounded">
                                  degree
                                </code>
                                ,{" "}
                                <code className="bg-background px-1 rounded">
                                  duration
                                </code>
                                ,{" "}
                                <code className="bg-background px-1 rounded">
                                  description
                                </code>
                              </li>
                            </ul>
                          ) : (
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                              <li>First row must contain column headers</li>
                              <li>
                                Required column:{" "}
                                <code className="bg-background px-1 rounded">
                                  name
                                </code>
                              </li>
                              <li>
                                Optional columns:{" "}
                                <code className="bg-background px-1 rounded">
                                  code
                                </code>
                                ,{" "}
                                <code className="bg-background px-1 rounded">
                                  degree
                                </code>
                                ,{" "}
                                <code className="bg-background px-1 rounded">
                                  duration
                                </code>
                                ,{" "}
                                <code className="bg-background px-1 rounded">
                                  description
                                </code>
                              </li>
                            </ul>
                          )}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsBulkUploadDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={bulkUploadMutation.isPending}
                        >
                          {bulkUploadMutation.isPending
                            ? "Uploading..."
                            : "Upload Programmes"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog
                  open={isProgrammeDialogOpen}
                  onOpenChange={setIsProgrammeDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Programme
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Programme</DialogTitle>
                      <DialogDescription>
                        Create a new programme for this institution
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateProgramme}>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="prog-name">Programme Name *</Label>
                          <Input
                            id="prog-name"
                            placeholder="e.g., Computer Science"
                            value={newProgramme.name}
                            onChange={(e) =>
                              setNewProgramme({
                                ...newProgramme,
                                name: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="code">Programme Code</Label>
                            <Input
                              id="code"
                              placeholder="e.g., CS"
                              value={newProgramme.code}
                              onChange={(e) =>
                                setNewProgramme({
                                  ...newProgramme,
                                  code: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="degree">Degree</Label>
                            <Input
                              id="degree"
                              placeholder="e.g., Bachelor"
                              value={newProgramme.degree}
                              onChange={(e) =>
                                setNewProgramme({
                                  ...newProgramme,
                                  degree: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="duration">Duration (years)</Label>
                          <Input
                            id="duration"
                            type="number"
                            min="1"
                            max="10"
                            placeholder="e.g., 4"
                            value={newProgramme.duration}
                            onChange={(e) =>
                              setNewProgramme({
                                ...newProgramme,
                                duration: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="prog-description">Description</Label>
                          <Textarea
                            id="prog-description"
                            placeholder="e.g., Bachelor of Computer Science"
                            value={newProgramme.description}
                            onChange={(e) =>
                              setNewProgramme({
                                ...newProgramme,
                                description: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsProgrammeDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={createProgrammeMutation.isPending}
                        >
                          {createProgrammeMutation.isPending
                            ? "Creating..."
                            : "Create Programme"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Card>
              <CardContent className="pt-6">
                {!programmes ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : programmes.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <GraduationCap className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p>No programmes found</p>
                    <p className="text-sm mt-2">
                      Click "Add Programme" or "Bulk Upload" to add programmes
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Programme Name</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Degree</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {programmes.map((programme) => (
                          <TableRow key={programme.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-md bg-role-instructor/10 flex items-center justify-center">
                                  <GraduationCap className="h-5 w-5 text-role-instructor" />
                                </div>
                                {programme.name}
                              </div>
                            </TableCell>
                            <TableCell>{programme.code || "-"}</TableCell>
                            <TableCell>{programme.degree || "-"}</TableCell>
                            <TableCell>
                              {programme.duration
                                ? `${programme.duration} years`
                                : "-"}
                            </TableCell>
                            <TableCell className="text-muted-foreground max-w-xs truncate">
                              {programme.description || "-"}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  if (
                                    confirm(
                                      "Are you sure you want to delete this programme?",
                                    )
                                  ) {
                                    deleteProgrammeMutation.mutate(
                                      programme.id,
                                    );
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
