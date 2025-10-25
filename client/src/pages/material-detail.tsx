import { useState, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  BookOpen, 
  Download, 
  Star, 
  MessageSquare, 
  Flag, 
  ChevronRight,
  FileText,
  Calendar,
  User,
  BookmarkPlus,
  BookmarkCheck,
  Eye,
  Share2,
  Maximize2,
  FileType,
  HardDrive
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Material, Bookmark as BookmarkType } from "@shared/schema";
import { format } from "date-fns";

export default function MaterialDetail() {
  const [, params] = useRoute("/material/:id");
  const [, navigate] = useLocation();
  const materialId = params?.id;
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showViewReviewsDialog, setShowViewReviewsDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reportReason, setReportReason] = useState("inappropriate");
  const [reportDescription, setReportDescription] = useState("");

  const { data: material, isLoading: materialLoading } = useQuery<Material & { 
    uploadedBy?: { id: string; firstName: string; lastName: string; role: string };
    course?: { title: string };
  }>({
    queryKey: [`/api/materials/${materialId}`],
    enabled: !!materialId,
  });

  const { data: ratings } = useQuery<{ average: number; count: number; userRating: any }>({
    queryKey: [`/api/materials/${materialId}/ratings`],
    enabled: !!materialId,
  });

  const { data: reviews } = useQuery<any[]>({
    queryKey: [`/api/materials/${materialId}/reviews`],
    queryFn: async () => {
      if (!materialId) return [];
      const res = await apiRequest("GET", `/api/materials/${materialId}/reviews`);
      return await res.json();
    },
    enabled: !!materialId,
  });

  const { data: relatedMaterials } = useQuery<Material[]>({
    queryKey: ["/api/materials", { 
      courseId: material?.courseId || undefined,
      level: material?.level || undefined,
      materialType: material?.materialType || undefined
    }],
    queryFn: async () => {
      if (!material) return [];
      const params = new URLSearchParams();
      if (material.courseId) params.set('courseId', material.courseId);
      if (material.level) params.set('level', material.level.toString());
      if (material.materialType) params.set('materialType', material.materialType);
      
      const res = await apiRequest("GET", `/api/materials?${params.toString()}`);
      const data = await res.json();
      return data.materials || [];
    },
    enabled: !!material,
  });

  const { data: bookmarks } = useQuery<BookmarkType[]>({
    queryKey: ["/api/bookmarks"],
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (!materialId) return;
      const bookmark = bookmarks?.find((b) => b.materialId === materialId);
      if (bookmark) {
        await apiRequest("DELETE", `/api/bookmarks/${bookmark.id}`);
      } else {
        await apiRequest("POST", "/api/bookmarks", { materialId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      toast({ title: "Success", description: "Bookmark updated" });
    },
  });

  const trackDownloadMutation = useMutation({
    mutationFn: async () => {
      if (!materialId) return;
      await apiRequest("POST", `/api/materials/${materialId}/download`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/materials/${materialId}`] });
    },
  });

  const ratingMutation = useMutation({
    mutationFn: async (rating: number) => {
      if (!materialId) return;
      return await apiRequest("POST", `/api/materials/${materialId}/ratings`, { rating });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/materials/${materialId}/ratings`] });
      toast({ title: "Success", description: "Rating submitted successfully" });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async (reviewText: string) => {
      if (!materialId) return;
      return await apiRequest("POST", `/api/materials/${materialId}/reviews`, { reviewText });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/materials/${materialId}/reviews`] });
      toast({ title: "Success", description: "Review posted successfully" });
      setShowReviewDialog(false);
      setReviewText("");
    },
  });

  const reportMutation = useMutation({
    mutationFn: async ({ reason, description }: { reason: string; description: string }) => {
      if (!materialId) return;
      return await apiRequest("POST", `/api/materials/${materialId}/reports`, { reason, description });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Report submitted successfully" });
      setShowReportDialog(false);
      setReportReason("inappropriate");
      setReportDescription("");
    },
  });

  const isBookmarked = bookmarks?.some((b) => b.materialId === materialId) ?? false;
  const filteredRelated = relatedMaterials?.filter(m => m.id !== materialId).slice(0, 5) || [];

  const getFileUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return url.startsWith('/') ? url : `/${url}`;
  };

  const getFullUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    const baseUrl = window.location.origin;
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${baseUrl}${path}`;
  };

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return "Unknown size";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const handleDownload = () => {
    trackDownloadMutation.mutate();
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Success", description: "Link copied to clipboard!" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to copy link", variant: "destructive" });
    }
  };

  const renderDocumentPreview = () => {
    if (!material?.fileUrl) return null;
    
    const fileUrl = getFileUrl(material.fileUrl);
    const fullFileUrl = getFullUrl(material.fileUrl);
    const fileType = (material.fileType || 'pdf').toLowerCase();

    if (fileType === 'pdf') {
      return (
        <div className="relative bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
          <iframe
            src={fileUrl}
            className="w-full h-[600px] border-0"
            title={material.title}
          />
        </div>
      );
    }

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)) {
      return (
        <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg p-8">
          <img
            src={fileUrl}
            alt={material.title}
            className="max-w-full max-h-[600px] object-contain rounded-lg"
          />
        </div>
      );
    }

    if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(fileType)) {
      const googleDocsViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fullFileUrl)}&embedded=true`;
      
      return (
        <div className="bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
          <iframe
            src={googleDocsViewerUrl}
            className="w-full h-[600px] border-0"
            title={material.title}
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-[600px] gap-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <p className="text-muted-foreground">Preview not available for this file type</p>
        <Button asChild onClick={handleDownload}>
          <a href={fileUrl} download>
            <Download className="mr-2 h-4 w-4" />
            Download File
          </a>
        </Button>
      </div>
    );
  };

  if (materialLoading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">Material Not Found</h2>
            <p className="text-muted-foreground mb-6">The material you're looking for doesn't exist or has been removed.</p>
            <Button asChild>
              <Link href="/resources">Back to Resources</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb Navigation */}
      <div className="border-b bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-4">
          <nav className="flex items-center text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <Link href="/resources" className="hover:text-foreground transition-colors">Resources</Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            {material.course?.title && (
              <>
                <span className="hover:text-foreground transition-colors">{material.course.title}</span>
                <ChevronRight className="h-4 w-4 mx-2" />
              </>
            )}
            <span className="text-foreground truncate max-w-[200px]">{material.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-foreground mb-3">{material.title}</h1>
                  <div className="flex items-center gap-3 mb-3">
                    {ratings && ratings.average > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= Math.round(ratings.average)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium">{ratings.average.toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">({ratings.count})</span>
                      </div>
                    )}
                    
                    {/* Statistics */}
                    <Separator orientation="vertical" className="h-5" />
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      <span>{material.viewCount || 0} views</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Download className="h-4 w-4" />
                      <span>{material.downloadCount || 0} downloads</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary" className="gap-1">
                  <FileType className="h-3 w-3" />
                  {material.fileType?.toUpperCase() || "PDF"}
                </Badge>
                {material.materialType && (
                  <Badge variant="outline">{material.materialType.replace(/_/g, " ")}</Badge>
                )}
                {material.level && <Badge variant="outline">{material.level} Level</Badge>}
                {material.semester && <Badge variant="outline">Semester {material.semester}</Badge>}
                {material.topic && <Badge>{material.topic}</Badge>}
                {material.fileSize && (
                  <Badge variant="secondary" className="gap-1">
                    <HardDrive className="h-3 w-3" />
                    {formatFileSize(material.fileSize)}
                  </Badge>
                )}
              </div>

              {material.description && (
                <p className="text-muted-foreground mb-4">{material.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                {material.uploadedBy && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>
                      {material.uploadedBy.firstName} {material.uploadedBy.lastName}
                      <Badge variant="outline" className="ml-2 text-xs">{material.uploadedBy.role}</Badge>
                    </span>
                  </div>
                )}
                {material.createdAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(material.createdAt), "MMM d, yyyy")}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button size="lg" asChild className="flex-1 sm:flex-none" onClick={handleDownload}>
                  <a href={getFileUrl(material.fileUrl!)} download>
                    <Download className="mr-2 h-5 w-5" />
                    Download
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => bookmarkMutation.mutate()}
                  disabled={bookmarkMutation.isPending}
                >
                  {isBookmarked ? (
                    <BookmarkCheck className="mr-2 h-5 w-5" />
                  ) : (
                    <BookmarkPlus className="mr-2 h-5 w-5" />
                  )}
                  {isBookmarked ? "Saved" : "Save"}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleShare}
                >
                  <Share2 className="mr-2 h-5 w-5" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setShowFullScreen(true)}
                >
                  <Maximize2 className="mr-2 h-5 w-5" />
                  Full Screen
                </Button>
              </div>
            </div>

            {/* Document Preview */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Preview</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFullScreen(true)}
                  >
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Full Screen
                  </Button>
                </div>
                {renderDocumentPreview()}
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Reviews ({reviews?.length || 0})</h2>
                  <Button onClick={() => setShowReviewDialog(true)}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Write a Review
                  </Button>
                </div>

                {reviews && reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.slice(0, 3).map((review: any) => (
                      <div key={review.id} className="border-b pb-4 last:border-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">
                            {review.user?.firstName} {review.user?.lastName}
                          </span>
                          <Badge variant="outline" className="text-xs">{review.user?.role}</Badge>
                          <span className="text-sm text-muted-foreground ml-auto">
                            {format(new Date(review.createdAt), "MMM d, yyyy")}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{review.reviewText}</p>
                      </div>
                    ))}
                    {reviews.length > 3 && (
                      <Button variant="outline" onClick={() => setShowViewReviewsDialog(true)} className="w-full">
                        View All {reviews.length} Reviews
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No reviews yet. Be the first to review this material!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Rate This Material */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Rate This Material</h3>
                <div className="flex gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => ratingMutation.mutate(star)}
                      className="transition-transform hover:scale-110"
                      disabled={ratingMutation.isPending}
                    >
                      <Star
                        className={`h-8 w-8 cursor-pointer ${
                          ratings?.userRating && star <= ratings.userRating.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300 hover:text-yellow-400"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {ratings?.userRating && (
                  <p className="text-sm text-muted-foreground">You rated this {ratings.userRating.rating} stars</p>
                )}
              </CardContent>
            </Card>

            {/* Report */}
            <Card>
              <CardContent className="p-6">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowReportDialog(true)}
                >
                  <Flag className="mr-2 h-4 w-4" />
                  Report Content
                </Button>
              </CardContent>
            </Card>

            {/* Material Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Material Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">File Type</span>
                    <span className="font-medium uppercase">{material.fileType || "PDF"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">File Size</span>
                    <span className="font-medium">{formatFileSize(material.fileSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Views</span>
                    <span className="font-medium">{material.viewCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Downloads</span>
                    <span className="font-medium">{material.downloadCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uploaded</span>
                    <span className="font-medium">
                      {material.createdAt ? format(new Date(material.createdAt), "MMM d, yyyy") : "Unknown"}
                    </span>
                  </div>
                  {material.updatedAt && material.updatedAt !== material.createdAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Updated</span>
                      <span className="font-medium">
                        {format(new Date(material.updatedAt), "MMM d, yyyy")}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Related Materials */}
            {filteredRelated.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Related Materials</h3>
                  <div className="space-y-3">
                    {filteredRelated.map((relMat) => (
                      <Link
                        key={relMat.id}
                        href={`/material/${relMat.id}`}
                        className="block group"
                      >
                        <div className="flex gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                          <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded flex items-center justify-center">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                              {relMat.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {relMat.fileType?.toUpperCase()}
                              </Badge>
                              {relMat.level && (
                                <span className="text-xs text-muted-foreground">{relMat.level}L</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>Share your thoughts about this material</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Write your review here..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={5}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>Cancel</Button>
            <Button
              onClick={() => reviewMutation.mutate(reviewText)}
              disabled={!reviewText || reviewMutation.isPending}
            >
              Post Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View All Reviews Dialog */}
      <Dialog open={showViewReviewsDialog} onOpenChange={setShowViewReviewsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Reviews ({reviews?.length || 0})</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {reviews?.map((review: any) => (
              <div key={review.id} className="border-b pb-4 last:border-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">
                    {review.user?.firstName} {review.user?.lastName}
                  </span>
                  <Badge variant="outline" className="text-xs">{review.user?.role}</Badge>
                  <span className="text-sm text-muted-foreground ml-auto">
                    {format(new Date(review.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
                <p className="text-muted-foreground">{review.reviewText}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Content</DialogTitle>
            <DialogDescription>Help us keep the platform safe by reporting inappropriate content</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason</Label>
              <select
                className="w-full mt-2 p-2 border rounded-md"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              >
                <option value="inappropriate">Inappropriate Content</option>
                <option value="spam">Spam</option>
                <option value="copyright">Copyright Violation</option>
                <option value="misleading">Misleading Information</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Please provide more details..."
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>Cancel</Button>
            <Button
              onClick={() => reportMutation.mutate({ reason: reportReason, description: reportDescription })}
              disabled={!reportDescription || reportMutation.isPending}
              variant="destructive"
            >
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full Screen Preview Dialog */}
      <Dialog open={showFullScreen} onOpenChange={setShowFullScreen}>
        <DialogContent className="max-w-6xl max-h-[95vh] p-2">
          <div className="h-[90vh]">
            {renderDocumentPreview()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
