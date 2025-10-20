import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CreateFlipbookDialog } from "@/components/dashboard/CreateFlipbookDialog";
import { FlipbookCard } from "@/components/dashboard/FlipbookCard";
import { toast } from "sonner";
import { LogOut, Plus } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface Flipbook {
  id: string;
  title: string;
  status: string;
  thumbnail_path: string | null;
  created_at: string;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [flipbooks, setFlipbooks] = useState<Flipbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadFlipbooks();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadFlipbooks = async () => {
    try {
      const { data, error } = await supabase
        .from("flipbooks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFlipbooks(data || []);
    } catch (error: any) {
      toast.error("Failed to load flipbooks");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleFlipbookCreated = () => {
    setCreateDialogOpen(false);
    loadFlipbooks();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            FlipFlow
          </h1>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Your Flipbooks</h2>
            <p className="text-muted-foreground mt-1">
              {flipbooks.length} {flipbooks.length === 1 ? "flipbook" : "flipbooks"}
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Flipbook
          </Button>
        </div>

        {flipbooks.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No flipbooks yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first flipbook to get started
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Flipbook
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {flipbooks.map((flipbook) => (
              <FlipbookCard
                key={flipbook.id}
                flipbook={flipbook}
                onUpdate={loadFlipbooks}
              />
            ))}
          </div>
        )}
      </main>

      <CreateFlipbookDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleFlipbookCreated}
      />
    </div>
  );
};

export default Dashboard;
