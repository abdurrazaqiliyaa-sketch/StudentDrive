import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookmarkCheck, Search, FileText, Download, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Bookmark, Material, Course } from "@shared/schema";

export default function Bookmarks() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: bookmarksData, isLoading } = useQuery<Bookmark[]>({
    queryKey: ["/api/bookmarks"],
  });

  const { data: materials } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
  });

  const removeBookmarkMutation = useMutation({
    mutationFn: async (bookmarkId: string) => {
      await apiRequest("DELETE", `/api/bookmarks/${bookmarkId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      toast({
        title: "Success",
        description: "Bookmark removed",
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
        description: "Failed to remove bookmark",
        variant: "destructive",
      });
    },
  });

  const bookmarkedMaterials = useMemo(() => {
    if (!bookmarksData || !materials) return [];
    return bookmarksData
      .map((bookmark) => {
        const material = materials.find((m) => m.id === bookmark.materialId);
        return material ? { ...material, bookmarkId: bookmark.id } : null;
      })
      .filter((item): item is Material & { bookmarkId: string } => item !== null);
  }, [bookmarksData, materials]);

  const filteredMaterials = useMemo(() => {
    return bookmarkedMaterials.filter((material) =>
      material.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [bookmarkedMaterials, searchTerm]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-section font-heading text-foreground mb-2">
          My Bookmarks
        </h1>
        <p className="text-muted-foreground">
          Access your saved materials and resources
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bookmarked materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-bookmarks"
            />
          </div>
        </CardContent>
      </Card>

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
        ) : filteredMaterials && filteredMaterials.length > 0 ? (
          filteredMaterials.map((material: any) => (
            <Card key={material.id} className="hover-elevate active-elevate-2" data-testid={`bookmark-card-${material.id}`}>
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
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary" className="text-xs">
                    {material.fileType?.toUpperCase() || "PDF"}
                  </Badge>
                  {material.course && (
                    <Badge variant="outline" className="text-xs">
                      {material.course.title}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" size="sm" data-testid={`button-download-${material.id}`}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeBookmarkMutation.mutate(material.bookmarkId)}
                    disabled={removeBookmarkMutation.isPending}
                    data-testid={`button-remove-${material.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <BookmarkCheck className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">No bookmarks yet</p>
            <p className="text-sm">Bookmark materials from the Resources page to see them here</p>
          </div>
        )}
      </div>
    </div>
  );
}
