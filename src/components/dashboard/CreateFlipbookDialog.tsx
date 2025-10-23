import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

// PDF.js worker is configured globally in index.html

interface CreateFlipbookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateFlipbookDialog = ({ open, onOpenChange, onSuccess }: CreateFlipbookDialogProps) => {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<'free' | 'pro'>('free');
  const [flipbookCount, setFlipbookCount] = useState<number>(0);

  // Load user role and flipbook count when dialog opens
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get role via RPC which defaults to 'free' if none exists
      const { data: roleValue } = await supabase.rpc('get_user_role', { _user_id: user.id });
      if (roleValue) {
        setUserRole(roleValue as 'free' | 'pro');
      }

      // Get flipbook count
      const { count } = await supabase
        .from('flipbooks')
        .select('id', { count: 'exact', head: true });

      setFlipbookCount(count || 0);
    };

    if (open) {
      init();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    // Enforce Free vs Pro limits
    const fileLimitMB = userRole === 'pro' ? 50 : 10;
    const maxSize = fileLimitMB * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File size must be less than ${fileLimitMB}MB${userRole === 'pro' ? '' : ' (upgrade to Pro for 50MB)'}`);
      return;
    }

    if (userRole === 'free' && flipbookCount >= 3) {
      toast.error('Free plan limit reached (3 flipbooks). Upgrade to Pro for unlimited flipbooks.');
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

        // pdf.js types are not bundled; the cast is limited to the render params
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await page.render({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          canvasContext: context as any,
          viewport: viewport,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    } catch (error: unknown) {
      const message = typeof error === 'string'
        ? error
        : (typeof error === 'object' && error && 'message' in error && typeof (error as { message: unknown }).message === 'string')
          ? (error as { message: string }).message
          : 'Failed to create flipbook';
      toast.error(message);
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
            <Label htmlFor="pdf">PDF File (Max {userRole === 'pro' ? '50MB' : '10MB'})</Label>
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
            {userRole === 'free' && (
              <p className="text-xs text-muted-foreground">
                Free plan: up to 3 flipbooks and 10MB per PDF. <a className="underline" href="/pricing">Upgrade to Pro</a> for unlimited flipbooks and 50MB uploads.
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
