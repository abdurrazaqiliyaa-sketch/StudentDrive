import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MaterialViewer } from "@/components/ui/material-viewer";
import { BookOpen, Search, Bookmark, BookmarkCheck, FileText, Download, Upload, Filter, X, Eye, Star, MessageSquare, Flag } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Bookmark as BookmarkType, Material, Course } from "@shared/schema";

export default function Resources() {
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [semesterFilter, setSemesterFilter] = useState<string>("all");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [materialTypeFilter, setMaterialTypeFilter] = useState<string>("all");
  const [uploaderRoleFilter, setUploaderRoleFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [page, setPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(25);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<(Material & { stats?: { averageRating: number; ratingCount: number; reviewCount: number } }) | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showViewReviewsDialog, setShowViewReviewsDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reportReason, setReportReason] = useState("inappropriate");
  const [reportDescription, setReportDescription] = useState("");
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  const buildQueryParams = () => {
    const params: Record<string, string> = {};
    if (searchTerm) params.search = searchTerm;
    if (courseFilter !== "all") params.courseId = courseFilter;
    if (levelFilter !== "all") params.level = levelFilter;
    if (semesterFilter !== "all") params.semester = semesterFilter;
    if (topicFilter !== "all") params.topic = topicFilter;
    if (materialTypeFilter !== "all") params.materialType = materialTypeFilter;
    if (uploaderRoleFilter !== "all") params.uploaderRole = uploaderRoleFilter;
    params.sortBy = sortBy;
    params.page = String(page);
    params.limit = String(pageLimit);
    return params;
  };

  const { data: materialsResponse, isLoading } = useQuery<{
    materials: (Material & { stats?: { averageRating: number; ratingCount: number; reviewCount: number } })[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
    topics: string[];
  }>({
    queryKey: ["/api/materials", buildQueryParams()],
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 10000,
  });

  const materials = materialsResponse?.materials || [];
  const pagination = materialsResponse?.pagination;
  const uniqueTopics = materialsResponse?.topics || [];

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: bookmarks } = useQuery<BookmarkType[]>({
    queryKey: ["/api/bookmarks"],
  });

  const bookmarkMutation = useMutation({
    mutationFn: async (materialId: string) => {
      if (!bookmarks) {
        await apiRequest("POST", "/api/bookmarks", { materialId });
        return;
      }
      const bookmark = bookmarks.find((b) => b.materialId === materialId);
      if (bookmark) {
        await apiRequest("DELETE", `/api/bookmarks/${bookmark.id}`);
      } else {
        await apiRequest("POST", "/api/bookmarks", { materialId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      toast({
        title: "Success",
        description: "Bookmark updated",
      });
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
        description: "Failed to update bookmark",
        variant: "destructive",
      });
    },
  });


  const reviewMutation = useMutation({
    mutationFn: async ({ materialId, reviewText }: { materialId: string; reviewText: string }) => {
      return await apiRequest("POST", `/api/materials/${materialId}/reviews`, { reviewText });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/materials/reviews"] });
      toast({ title: "Success", description: "Review posted successfully" });
      setShowReviewDialog(false);
      setReviewText("");
      setSelectedMaterial(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to post review", variant: "destructive" });
    },
  });

  const ratingMutation = useMutation({
    mutationFn: async ({ materialId, rating }: { materialId: string; rating: number }) => {
      return await apiRequest("POST", `/api/materials/${materialId}/ratings`, { rating });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      toast({ title: "Success", description: "Rating submitted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to submit rating", variant: "destructive" });
    },
  });

  const reportMutation = useMutation({
    mutationFn: async ({ materialId, reason, description }: { materialId: string; reason: string; description: string }) => {
      return await apiRequest("POST", `/api/materials/${materialId}/reports`, { reason, description });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Report submitted successfully" });
      setShowReportDialog(false);
      setReportReason("inappropriate");
      setReportDescription("");
      setSelectedMaterial(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to submit report", variant: "destructive" });
    },
  });

  const isBookmarked = (materialId: string) => {
    return bookmarks?.some((b) => b.materialId === materialId) ?? false;
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, courseFilter, levelFilter, semesterFilter, topicFilter, materialTypeFilter, uploaderRoleFilter, sortBy, pageLimit]);

  const clearFilters = () => {
    setCourseFilter("all");
    setLevelFilter("all");
    setSemesterFilter("all");
    setTopicFilter("all");
    setMaterialTypeFilter("all");
    setUploaderRoleFilter("all");
    setSortBy("newest");
    setPage(1);
  };

  const activeFiltersCount = [
    courseFilter !== "all",
    levelFilter !== "all",
    semesterFilter !== "all",
    topicFilter !== "all",
    materialTypeFilter !== "all",
    uploaderRoleFilter !== "all",
  ].filter(Boolean).length;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-section font-heading text-foreground mb-2">
            Resource Library
          </h1>
          <p className="text-muted-foreground">
            Access study materials, lecture notes, and educational resources
          </p>
        </div>
        {(user?.role === "student" || user?.role === "instructor") && (
          <Button asChild>
            <Link href="/student/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload Material
            </Link>
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search materials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" onClick={clearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>

            {showFilters && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-xs text-muted-foreground mb-2">Course</Label>
                  <Select value={courseFilter} onValueChange={setCourseFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Courses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courses</SelectItem>
                      {courses?.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-2">Level</Label>
                  <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="100">100 Level</SelectItem>
                      <SelectItem value="200">200 Level</SelectItem>
                      <SelectItem value="300">300 Level</SelectItem>
                      <SelectItem value="400">400 Level</SelectItem>
                      <SelectItem value="500">500 Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-2">Semester</Label>
                  <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Semesters" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Semesters</SelectItem>
                      <SelectItem value="1">1st Semester</SelectItem>
                      <SelectItem value="2">2nd Semester</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-2">Material Type</Label>
                  <Select value={materialTypeFilter} onValueChange={setMaterialTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="lecture_notes">Lecture Notes</SelectItem>
                      <SelectItem value="textbook">Textbook</SelectItem>
                      <SelectItem value="study_guide">Study Guide</SelectItem>
                      <SelectItem value="past_questions">Past Questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-2">Topic</Label>
                  <Select value={topicFilter} onValueChange={setTopicFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Topics" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Topics</SelectItem>
                      {uniqueTopics.map((topic) => (
                        <SelectItem key={topic} value={topic}>
                          {topic}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-2">Uploaded By</Label>
                  <Select value={uploaderRoleFilter} onValueChange={setUploaderRoleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Anyone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Anyone</SelectItem>
                      <SelectItem value="instructor">Instructors</SelectItem>
                      <SelectItem value="student">Students</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sorting and Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium">Sort by:</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="highest_rated">Highest Rated</SelectItem>
              <SelectItem value="most_reviewed">Most Reviewed</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium">Show:</Label>
          <Select value={String(pageLimit)} onValueChange={(val) => setPageLimit(parseInt(val))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {pagination ? `${(page - 1) * pageLimit + 1}-${Math.min(page * pageLimit, pagination.total)} of ${pagination.total}` : '0 items'}
          </span>
        </div>
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
                  {isAdmin && material.moderationStatus && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        material.moderationStatus === 'approved' ? 'bg-green-50 text-green-700 border-green-300' :
                        material.moderationStatus === 'rejected' ? 'bg-red-50 text-red-700 border-red-300' :
                        'bg-yellow-50 text-yellow-700 border-yellow-300'
                      }`}
                    >
                      {material.moderationStatus}
                    </Badge>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      size="sm"
                      asChild
                    >
                      <Link href={`/material/${material.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => bookmarkMutation.mutate(material.id)}
                      disabled={bookmarkMutation.isPending}
                      title={isBookmarked(material.id) ? "Remove bookmark" : "Bookmark"}
                    >
                      {isBookmarked(material.id) ? (
                        <BookmarkCheck className="h-4 w-4" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="outline" size="icon" asChild title="Download">
                      <a href={material.fileUrl} download>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const avgRating = material.stats?.averageRating || 0;
                          const isFilled = star <= Math.round(avgRating);
                          return (
                            <button
                              key={star}
                              onClick={() => ratingMutation.mutate({ materialId: material.id, rating: star })}
                              className="transition-colors hover:scale-110"
                              title={`Rate ${star} stars`}
                            >
                              <Star
                                className={`h-4 w-4 ${
                                  isFilled 
                                    ? 'fill-amber-400 stroke-amber-400' 
                                    : 'fill-none stroke-gray-300'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                      {material.stats?.ratingCount && material.stats.ratingCount > 0 && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({material.stats.ratingCount})
                        </span>
                      )}
                    </div>
                    <div className="flex-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedMaterial(material);
                        setShowViewReviewsDialog(true);
                      }}
                      title="View reviews"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {material.stats?.reviewCount && material.stats.reviewCount > 0 && (
                        <span className="ml-1 text-xs">({material.stats.reviewCount})</span>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedMaterial(material);
                        setShowReportDialog(true);
                      }}
                      title="Report this material"
                    >
                      <Flag className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">No materials found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 1 || isLoading}
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
                  size="icon"
                  className="w-10"
                  onClick={() => setPage(pageNum)}
                  disabled={isLoading}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page === pagination.totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      )}

      {/* Material Viewer Dialog */}
      <MaterialViewer
        isOpen={showViewer}
        onClose={() => {
          setShowViewer(false);
          setSelectedMaterial(null);
        }}
        material={selectedMaterial}
      />

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>
              Share your thoughts about this material
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Write your review here..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={5}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedMaterial && reviewText.trim()) {
                  reviewMutation.mutate({
                    materialId: selectedMaterial.id,
                    reviewText: reviewText.trim(),
                  });
                }
              }}
              disabled={!reviewText.trim() || reviewMutation.isPending}
            >
              Post Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Reviews Dialog */}
      <Dialog open={showViewReviewsDialog} onOpenChange={setShowViewReviewsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedMaterial?.title} - Reviews</DialogTitle>
            <DialogDescription>
              {selectedMaterial?.stats?.reviewCount || 0} review(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>View full reviews on the material detail page</p>
              <Button asChild className="mt-4">
                <Link href={`/material/${selectedMaterial?.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Material Details
                </Link>
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowViewReviewsDialog(false);
                setShowReviewDialog(true);
              }}
            >
              Write a Review
            </Button>
            <Button variant="outline" onClick={() => setShowViewReviewsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Material</DialogTitle>
            <DialogDescription>
              Help us maintain quality by reporting inappropriate content
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="copyright">Copyright Violation</SelectItem>
                  <SelectItem value="inaccurate">Inaccurate Information</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Additional Details</Label>
              <Textarea
                placeholder="Please provide more details..."
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedMaterial) {
                  reportMutation.mutate({
                    materialId: selectedMaterial.id,
                    reason: reportReason,
                    description: reportDescription,
                  });
                }
              }}
              disabled={reportMutation.isPending}
            >
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
