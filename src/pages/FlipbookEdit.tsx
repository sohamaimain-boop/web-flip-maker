import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Trash2, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Flipbook {
  id: string;
  user_id: string;
  title: string;
  background_color: string;
  background_image_path: string | null;
  logo_image_path: string | null;
}

const FlipbookEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [flipbook, setFlipbook] = useState<Flipbook | null>(null);
  const [title, setTitle] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#FFFFFF");
  const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
  const [logoImage, setLogoImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFlipbook();
  }, [id]);

  const loadFlipbook = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: flipbookData, error } = await supabase
        .from("flipbooks")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (flipbookData.user_id !== user.id) {
        toast.error("You don't have permission to edit this flipbook");
        navigate("/dashboard");
        return;
      }

      setFlipbook(flipbookData);
      setTitle(flipbookData.title);
      setBackgroundColor(flipbookData.background_color);
    } catch (error: any) {
      toast.error("Failed to load flipbook");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let backgroundImagePath = flipbook?.background_image_path;
      let logoImagePath = flipbook?.logo_image_path;

      // Upload background image if selected
      if (backgroundImage) {
        const fileName = `${user.id}/${Date.now()}_${backgroundImage.name}`;
        const { error: uploadError } = await supabase.storage
          .from("backgrounds")
          .upload(fileName, backgroundImage);

        if (uploadError) throw uploadError;
        backgroundImagePath = fileName;
      }

      // Upload logo image if selected
      if (logoImage) {
        const fileName = `${user.id}/${Date.now()}_${logoImage.name}`;
        const { error: uploadError } = await supabase.storage
          .from("logos")
          .upload(fileName, logoImage);

        if (uploadError) throw uploadError;
        logoImagePath = fileName;
      }

      const { error } = await supabase
        .from("flipbooks")
        .update({
          title,
          background_color: backgroundColor,
          background_image_path: backgroundImagePath,
          logo_image_path: logoImagePath,
        })
        .eq("id", id);

      if (error) throw error;
      toast.success("Flipbook updated successfully!");
      setBackgroundImage(null);
      setLogoImage(null);
    } catch (error: any) {
      toast.error("Failed to update flipbook");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("flipbooks")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Flipbook deleted successfully");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error("Failed to delete flipbook");
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
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/flipbook/${id}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-xl font-bold">Edit Flipbook</h1>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Flipbook Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="backgroundColor">Background Color</Label>
              <div className="flex gap-2">
                <Input
                  id="backgroundColor"
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="backgroundImage">Background Image (optional)</Label>
              <Input
                id="backgroundImage"
                type="file"
                accept="image/*"
                onChange={(e) => setBackgroundImage(e.target.files?.[0] || null)}
              />
              {flipbook?.background_image_path && !backgroundImage && (
                <p className="text-sm text-muted-foreground">Current: {flipbook.background_image_path.split('/').pop()}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoImage">Logo Image (optional)</Label>
              <Input
                id="logoImage"
                type="file"
                accept="image/*"
                onChange={(e) => setLogoImage(e.target.files?.[0] || null)}
              />
              {flipbook?.logo_image_path && !logoImage && (
                <p className="text-sm text-muted-foreground">Current: {flipbook.logo_image_path.split('/').pop()}</p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your flipbook.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FlipbookEdit;
