import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Share2, Edit, BarChart } from "lucide-react";
import { FlipbookViewer } from "@/components/flipbook/FlipbookViewer";

interface Flipbook {
  id: string;
  user_id: string;
  title: string;
  pdf_storage_path: string;
  background_color: string;
  background_image_path: string | null;
  logo_image_path: string | null;
  view_count: number;
}

const FlipbookView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [flipbook, setFlipbook] = useState<Flipbook | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFlipbook();
  }, [id]);

  const loadFlipbook = async () => {
    try {
      const { data: flipbookData, error } = await supabase
        .from("flipbooks")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setFlipbook(flipbookData);

      // Get PDF URL
      const { data: { publicUrl } } = supabase.storage
        .from("pdfs")
        .getPublicUrl(flipbookData.pdf_storage_path);
      
      setPdfUrl(publicUrl);

      // Check if current user is owner
      const { data: { user } } = await supabase.auth.getUser();
      setIsOwner(user?.id === flipbookData.user_id);

      // Increment view count
      await supabase
        .from("flipbooks")
        .update({ view_count: flipbookData.view_count + 1 })
        .eq("id", id);
    } catch (error: any) {
      toast.error("Failed to load flipbook");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!flipbook) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-xl font-bold">{flipbook.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            {isOwner && (
              <>
                <Button variant="outline" size="sm" onClick={() => navigate(`/flipbook/${id}/edit`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate(`/flipbook/${id}/analytics`)}>
                  <BarChart className="mr-2 h-4 w-4" />
                  Analytics
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <FlipbookViewer 
          pdfUrl={pdfUrl} 
          backgroundColor={flipbook.background_color}
          backgroundImagePath={flipbook.background_image_path}
          logoImagePath={flipbook.logo_image_path}
        />
        
        {!isOwner && (
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Made with <span className="font-semibold text-primary">FlipFlow</span>
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default FlipbookView;
