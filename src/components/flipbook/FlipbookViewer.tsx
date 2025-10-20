import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import HTMLFlipBook from "react-pageflip";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

// Configure PDF.js worker with a more reliable CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

interface FlipbookViewerProps {
  pdfUrl: string;
  backgroundColor?: string;
  backgroundImagePath?: string | null;
  logoImagePath?: string | null;
}

const PageCover = ({ children, pos }: { children: React.ReactNode; pos: string }) => (
  <div className={`page page-cover page-cover-${pos}`} data-density="hard">
    <div className="page-content">
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
        {children}
      </div>
    </div>
  </div>
);

const Page = ({ image, pageNumber }: { image: string; pageNumber: number }) => (
  <div className="page">
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
  const bookRef = useRef<any>(null);

  useEffect(() => {
    loadPdf();
    loadImages();
  }, [pdfUrl, backgroundImagePath, logoImagePath]);

  const loadImages = () => {
    if (backgroundImagePath) {
      const { data } = supabase.storage.from("backgrounds").getPublicUrl(backgroundImagePath);
      setBackgroundImageUrl(data.publicUrl);
    }
    if (logoImagePath) {
      const { data } = supabase.storage.from("logos").getPublicUrl(logoImagePath);
      setLogoImageUrl(data.publicUrl);
    }
  };

  const loadPdf = async () => {
    try {
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      const pageImages: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        } as any).promise;

        pageImages.push(canvas.toDataURL());
      }

      setPages(pageImages);
      setTotalPages(pageImages.length);
      setLoading(false);
    } catch (error) {
      console.error("Error loading PDF:", error);
      setLoading(false);
    }
  };

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
        <div className="relative">
        <HTMLFlipBook
          ref={bookRef}
          width={550}
          height={733}
          size="stretch"
          minWidth={315}
          maxWidth={1000}
          minHeight={400}
          maxHeight={1533}
          maxShadowOpacity={0.5}
          showCover={true}
          mobileScrollSupport={true}
          onFlip={(e: any) => setCurrentPage(e.data)}
          className="shadow-2xl"
          style={{}}
          startPage={0}
          drawShadow={true}
          flippingTime={1000}
          usePortrait={true}
          startZIndex={0}
          autoSize={true}
          clickEventForward={true}
          useMouseEvents={true}
          swipeDistance={30}
          showPageCorners={true}
          disableFlipByClick={false}
        >
          <PageCover pos="top">
            <h2 className="text-4xl font-bold text-primary">FlipBook</h2>
          </PageCover>
          
          {pages.map((page, index) => (
            <Page key={index} image={page} pageNumber={index + 1} />
          ))}
          
          <PageCover pos="bottom">
            <h2 className="text-2xl font-semibold text-muted-foreground">The End</h2>
          </PageCover>
        </HTMLFlipBook>
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
          Page {currentPage + 1} of {totalPages + 2}
        </span>
        
        <Button
          variant="outline"
          size="icon"
          onClick={nextPage}
          disabled={currentPage >= totalPages + 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      </div>
    </div>
  );
};
