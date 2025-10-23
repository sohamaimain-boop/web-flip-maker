
import { useEffect, useRef, useState, forwardRef, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
// Import the pdf.js worker so Vite bundles it locally instead of using a CDN
// Vite will treat the import as a web worker and return a Worker constructor
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Vite provides types for ?worker via vite/client
import PdfWorker from "pdfjs-dist/build/pdf.worker.mjs?worker";
import HTMLFlipBook from "react-pageflip";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

// Configure PDF.js to use the locally bundled worker (avoids cross-origin/CDN issues)
if (typeof window !== "undefined" && "Worker" in window) {
  try {
    // Create a dedicated worker instance for pdf.js
    const worker = new (PdfWorker as unknown as { new (): Worker })();
    // Use the workerPort API introduced in pdf.js v5
    // This takes precedence over workerSrc
    // https://github.com/mozilla/pdf.js/wiki/Frequently-Asked-Questions#pdfjs-worker
    // Cast to a narrow shape to avoid using 'any'
    const lib = pdfjsLib as unknown as {
      GlobalWorkerOptions: { workerPort: Worker | null; workerSrc?: string };
    };
    lib.GlobalWorkerOptions.workerPort = worker;
  } catch {
    // Fallback: disable worker to avoid fake-worker errors (slower rendering)
    const lib = pdfjsLib as unknown as {
      GlobalWorkerOptions: { workerPort: Worker | null; workerSrc?: string };
    };
    lib.GlobalWorkerOptions.workerPort = null;
    lib.GlobalWorkerOptions.workerSrc = "";
  }
}

interface FlipbookViewerProps {
  pdfUrl: string;
  backgroundColor?: string;
  backgroundImagePath?: string | null;
  logoImagePath?: string | null;
}

const PageCover = forwardRef<HTMLDivElement, { image: string; pageNumber: number }>(
  ({ image, pageNumber }, ref) => (
    <div ref={ref} className="page page-cover" data-density="hard">
      <div className="page-content">
        <div className="w-full h-full bg-white flex items-center justify-center p-4">
          <img 
            src={image} 
            alt={`Page ${pageNumber}`} 
            className="max-w-full max-h-full object-contain"
          />
        </div>
      </div>
    </div>
  )
);

const Page = forwardRef<HTMLDivElement, { image: string; pageNumber: number }>(
  ({ image, pageNumber }, ref) => (
    <div ref={ref} className="page">
      <div className="page-content">
        <div className="w-full h-full bg-white flex items-center justify-center p-4">
          <img 
            src={image} 
            alt={`Page ${pageNumber}`} 
            className="max-w-full max-h-full object-contain"
          />
        </div>
        <div className="page-footer text-xs text-muted-foreground text-center py-2">
          {pageNumber}
        </div>
      </div>
    </div>
  )
);

export const FlipbookViewer = ({ 
  pdfUrl, 
  backgroundColor = "#FFFFFF",
  backgroundImagePath,
  logoImagePath 
}: FlipbookViewerProps) => {
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>("");
  const [logoImageUrl, setLogoImageUrl] = useState<string>("");
  const [pageWidth, setPageWidth] = useState(550);
  const [pageHeight, setPageHeight] = useState(733);
  type PageFlipController = { flipNext: () => void; flipPrev: () => void };
  type FlipBookHandle = { pageFlip: () => PageFlipController };
  const bookRef = useRef<FlipBookHandle | null>(null);

  const loadImages = useCallback(() => {
    if (backgroundImagePath) {
      const { data } = supabase.storage
        .from("backgrounds")
        .getPublicUrl(backgroundImagePath);
      setBackgroundImageUrl(data.publicUrl);
    } else {
      setBackgroundImageUrl("");
    }
    if (logoImagePath) {
      const { data } = supabase.storage.from("logos").getPublicUrl(logoImagePath);
      setLogoImageUrl(data.publicUrl);
    } else {
      setLogoImageUrl("");
    }
  }, [backgroundImagePath, logoImagePath]);

  const loadPdf = useCallback(async () => {
    try {
      const loadingTask = pdfjsLib.getDocument({
        url: pdfUrl,
        useSystemFonts: true,
      });
      const pdf = await loadingTask.promise;
      const pageImages: string[] = [];

      // Get first page to determine dimensions
      const firstPage = await pdf.getPage(1);
      const firstViewport = firstPage.getViewport({ scale: 1 });
      const pdfWidth = firstViewport.width;
      const pdfHeight = firstViewport.height;
      
      // Calculate aspect ratio and set appropriate dimensions
      const aspectRatio = pdfWidth / pdfHeight;
      let displayWidth: number;
      let displayHeight: number;
      
      if (aspectRatio > 1) {
        // Landscape orientation
        displayWidth = 800;
        displayHeight = Math.round(displayWidth / aspectRatio);
      } else {
        // Portrait orientation
        displayHeight = 733;
        displayWidth = Math.round(displayHeight * aspectRatio);
      }
      
      setPageWidth(displayWidth);
      setPageHeight(displayHeight);

      // Render all pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderTask = page.render({
          canvas,
          viewport,
        });
        await renderTask.promise;

        pageImages.push(canvas.toDataURL('image/jpeg', 0.9));
      }

      setPages(pageImages);
      setTotalPages(pageImages.length);
      setLoading(false);
    } catch (error) {
      console.error("Error loading PDF:", error);
      setLoading(false);
    }
  }, [pdfUrl]);

  useEffect(() => {
    void loadPdf();
    loadImages();
  }, [loadPdf, loadImages]);

  const nextPage = () => {
    if (bookRef.current) {
      bookRef.current.pageFlip().flipNext();
    }
  };

  const prevPage = () => {
    if (bookRef.current) {
      bookRef.current.pageFlip().flipPrev();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading flipbook...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {logoImageUrl && (
        <div className="mb-4 text-center">
          <img src={logoImageUrl} alt="Logo" className="h-16 mx-auto" />
        </div>
      )}
      <div 
        className="flex flex-col items-center gap-6 p-8" 
        style={{ 
          backgroundColor,
          backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="relative w-full flex justify-center">
          {pages.length > 0 && (
            <HTMLFlipBook
              ref={bookRef}
              width={pageWidth}
              height={pageHeight}
              size="stretch"
              minWidth={Math.floor(pageWidth * 0.5)}
              maxWidth={Math.floor(pageWidth * 2)}
              minHeight={Math.floor(pageHeight * 0.5)}
              maxHeight={Math.floor(pageHeight * 2)}
              maxShadowOpacity={0.5}
              showCover={true}
              mobileScrollSupport={true}
              onFlip={(e: { data: number }) => setCurrentPage(e.data)}
              className="shadow-2xl"
              style={{}}
              startPage={0}
              drawShadow={true}
              flippingTime={1000}
              usePortrait={pageHeight > pageWidth}
              startZIndex={0}
              autoSize={true}
              clickEventForward={true}
              useMouseEvents={true}
              swipeDistance={30}
              showPageCorners={true}
              disableFlipByClick={false}
            >
              {/* First page as cover (single page) */}
              <PageCover image={pages[0]} pageNumber={1} />
              
              {/* Middle pages (double page spread) */}
              {pages.slice(1, -1).map((page, index) => (
                <Page key={index + 1} image={page} pageNumber={index + 2} />
              ))}
              
              {/* Last page as cover (single page) */}
              {pages.length > 1 && (
                <PageCover image={pages[pages.length - 1]} pageNumber={pages.length} />
              )}
            </HTMLFlipBook>
          )}
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={prevPage}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm text-muted-foreground min-w-[100px] text-center">
            Page {currentPage + 1} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="icon"
            onClick={nextPage}
            disabled={currentPage >= totalPages - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
