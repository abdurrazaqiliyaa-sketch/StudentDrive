import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface MaterialViewerProps {
  isOpen: boolean;
  onClose: () => void;
  material: {
    title: string;
    fileUrl: string | null;
    fileType: string | null;
  } | null;
}

export function MaterialViewer({ isOpen, onClose, material }: MaterialViewerProps) {
  if (!material || !material.fileUrl) return null;

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

  const renderContent = () => {
    const fileUrl = getFileUrl(material.fileUrl!);
    const fullFileUrl = getFullUrl(material.fileUrl!);
    const fileType = (material.fileType || 'pdf').toLowerCase();

    if (fileType === 'pdf') {
      return (
        <iframe
          src={fileUrl}
          className="w-full h-[70vh] border-0"
          title={material.title}
        />
      );
    }

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)) {
      return (
        <div className="flex items-center justify-center h-[70vh] bg-gray-50 dark:bg-gray-900">
          <img
            src={fileUrl}
            alt={material.title}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      );
    }

    if (['doc', 'docx', 'ppt', 'pptx'].includes(fileType)) {
      const googleDocsViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fullFileUrl)}&embedded=true`;
      
      return (
        <div className="w-full h-[70vh]">
          <iframe
            src={googleDocsViewerUrl}
            className="w-full h-full border-0"
            title={material.title}
          />
        </div>
      );
    }

    if (['xls', 'xlsx'].includes(fileType)) {
      const googleDocsViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fullFileUrl)}&embedded=true`;
      
      return (
        <div className="w-full h-[70vh]">
          <iframe
            src={googleDocsViewerUrl}
            className="w-full h-full border-0"
            title={material.title}
          />
        </div>
      );
    }

    if (fileType === 'txt') {
      return (
        <iframe
          src={fileUrl}
          className="w-full h-[70vh] border-0 bg-white dark:bg-gray-900"
          title={material.title}
        />
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4 bg-gray-50 dark:bg-gray-900">
        <p className="text-muted-foreground">
          Preview not available for this file type
        </p>
        <Button asChild>
          <a href={fileUrl} download>
            <Download className="mr-2 h-4 w-4" />
            Download File
          </a>
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{material.title}</DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={getFileUrl(material.fileUrl!)} download>
                  <Download className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="p-6 pt-4">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
