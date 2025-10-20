import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Loader2 } from "lucide-react";

// Configure PDF.js worker with a more reliable CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

interface FlipbookViewerProps {
  pdfUrl: string;
  backgroundColor?: string;
}

export const FlipbookViewer = ({ pdfUrl, backgroundColor = "#FFFFFF" }: FlipbookViewerProps) => {
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPdf();
  }, [pdfUrl]);

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
      setLoading(false);
    } catch (error) {
      console.error("Error loading PDF:", error);
      setLoading(false);
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
    <div
      ref={containerRef}
      className="flex flex-col items-center gap-4 p-8 rounded-lg"
      style={{ backgroundColor }}
    >
      <div className="max-w-4xl w-full">
        {pages.map((page, index) => (
          <div key={index} className="mb-8 shadow-2xl rounded-lg overflow-hidden">
            <img src={page} alt={`Page ${index + 1}`} className="w-full h-auto" />
          </div>
        ))}
      </div>
    </div>
  );
};
