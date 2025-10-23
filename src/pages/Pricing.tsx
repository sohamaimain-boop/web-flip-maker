import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
const errorMessage = (err: unknown, fallback: string) => {
  if (typeof err === 'string') return err;
  if (
    err &&
    typeof err === 'object' &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string'
  ) {
    return (err as { message: string }).message;
  }
  return fallback;
};

type RazorpayPaymentResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayPaymentResponse) => void;
  prefill?: { email?: string };
  theme?: { color?: string };
};

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

const Pricing = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("free");
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    checkUser();
    loadRazorpayScript();
  }, []);

  const loadRazorpayScript = () => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);
  };

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      // Prefer server function to safely return 'free' when no row exists
      const { data: roleValue } = await supabase.rpc('get_user_role', { _user_id: user.id });
      if (roleValue) setUserRole(roleValue as string);
    }
  };

  const handleUpgrade = async () => {
    // Ensure we have an active session and token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.access_token) {
      toast.error("Please sign in to upgrade");
      navigate("/auth");
      return;
    }

    if (!scriptLoaded) {
      toast.error("Payment system loading, please try again");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-razorpay-order", {
        body: { amount: 999, currency: "INR", plan_type: "pro" },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      const options: RazorpayOptions = {
        key: data.razorpay_key_id,
        amount: data.amount,
        currency: data.currency,
        name: "FlipFlow",
        description: "Pro Plan - Unlimited Flipbooks",
        order_id: data.order_id,
        handler: async function (response: RazorpayPaymentResponse) {
          await verifyPayment(response);
        },
        prefill: { email: session.user?.email || "" },
        theme: {
          color: "#8B5CF6",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error: unknown) {
      toast.error(errorMessage(error, 'Failed to initiate payment'));
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (response: RazorpayPaymentResponse) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.access_token) {
        toast.error("Session expired. Please sign in again.");
        navigate("/auth");
        return;
      }

      const { error } = await supabase.functions.invoke("verify-razorpay-payment", {
        body: {
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      toast.success("Payment successful! You are now a Pro user");
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (error: unknown) {
      toast.error(errorMessage(error, 'Payment verification failed'));
    }
  };

  const plans = [
    {
      name: "Free",
      price: "₹0",
      period: "forever",
      description: "Perfect for trying out FlipFlow",
      features: [
        "3 Flipbooks",
        "10MB Max File Size",
        "Client-side PDF processing",
        "Basic Background Color",
        "Total Views Analytics",
        "Public sharing URL",
        '"Made with FlipFlow" Branding',
      ],
      cta: "Current Plan",
      disabled: true,
      highlight: false,
    },
    {
      name: "Pro",
      price: "₹999",
      period: "lifetime",
      description: "Everything you need to create professional flipbooks",
      features: [
        "Unlimited Flipbooks",
        "50MB Max File Size",
        "Remove FlipFlow Branding",
        "Upload Custom Logo",
        "Background Images & advanced styling",
        "Advanced, page-level analytics",
        "Public URL + Embed via iframe",
        "Offline download (self-contained HTML)",
        "Server-side PDF processing (coming soon)",
      ],
      cta: userRole === "pro" ? "Current Plan" : "Upgrade to Pro",
      disabled: userRole === "pro",
      highlight: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground">
            Choose the plan that works best for you
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${
                plan.highlight
                  ? "border-primary shadow-lg scale-105"
                  : "border-border"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground ml-2">/ {plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  size="lg"
                  variant={plan.highlight ? "default" : "outline"}
                  disabled={plan.disabled || loading}
                  onClick={plan.name === "Pro" ? handleUpgrade : undefined}
                >
                  {loading && plan.name === "Pro" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    plan.cta
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
