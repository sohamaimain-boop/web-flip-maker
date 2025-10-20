import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?worker";

// Configure PDF.js worker for thumbnail generation
pdfjsLib.GlobalWorkerOptions.workerPort = new pdfjsWorker();

interface CreateFlipbookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateFlipbookDialog = ({ open, onOpenChange, onSuccess }: CreateFlipbookDialogProps) => {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    // Check file size (10MB limit for free users)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload PDF to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("pdfs")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Generate thumbnail from first page
      const { data: { publicUrl } } = supabase.storage.from("pdfs").getPublicUrl(filePath);
      
      let thumbnailPath = null;
      try {
        const response = await fetch(publicUrl);
        const arrayBuffer = await response.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.5 });
        
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d")!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        } as any).promise;

        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.8);
        });

        // Upload thumbnail
        const thumbnailFileName = `${user.id}/${crypto.randomUUID()}_thumb.jpg`;
        const { error: thumbError } = await supabase.storage
          .from("thumbnails")
          .upload(thumbnailFileName, blob);

        if (!thumbError) {
          thumbnailPath = thumbnailFileName;
        }
      } catch (thumbError) {
        console.error("Failed to generate thumbnail:", thumbError);
      }

      // Create flipbook record
      const { error: insertError } = await supabase
        .from("flipbooks")
        .insert({
          user_id: user.id,
          title,
          pdf_storage_path: filePath,
          thumbnail_path: thumbnailPath,
          status: "ready",
        });

      if (insertError) throw insertError;

      toast.success("Flipbook created successfully!");
      setTitle("");
      setFile(null);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to create flipbook");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Flipbook</DialogTitle>
          <DialogDescription>
            Upload a PDF and give it a title to create your flipbook
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="My Amazing Flipbook"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pdf">PDF File (Max 10MB)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="pdf"
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
                className="cursor-pointer"
              />
              <Upload className="h-4 w-4 text-muted-foreground" />
            </div>
            {file && (
              <p className="text-sm text-muted-foreground">
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading || !file || !title}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Flipbook
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
