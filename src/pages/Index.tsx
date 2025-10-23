import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BookOpen, Zap, TrendingUp, Sparkles } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            FlipFlow
          </h1>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate("/pricing")}>
              Pricing
            </Button>
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
            <Button onClick={() => navigate("/auth")}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Transform PDFs into Stunning Digital Flipbooks
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Create engaging, interactive flipbooks in seconds. Perfect for marketers, educators, and content creators.
            </p>
            <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8">
              Start Creating Free
            </Button>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6 rounded-lg bg-card border">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Upload your PDF and create a flipbook in seconds. No complicated setup required.
              </p>
            </div>

            <div className="text-center p-6 rounded-lg bg-card border">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Beautiful & Interactive</h3>
              <p className="text-muted-foreground">
                Engage your audience with smooth page turns and responsive design.
              </p>
            </div>

            <div className="text-center p-6 rounded-lg bg-card border">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Performance</h3>
              <p className="text-muted-foreground">
                Monitor views and engagement with built-in analytics.
              </p>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-3xl mx-auto p-8 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
            <p className="text-muted-foreground mb-6">
              Join thousands of users creating beautiful flipbooks. Start for free today!
            </p>
            <Button size="lg" onClick={() => navigate("/auth")}>
              Create Your First Flipbook
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2025 FlipFlow. Transform your PDFs into engaging experiences.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
