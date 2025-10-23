// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-debug-token",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require a debug token so this endpoint can't be probed publicly
    const expectedToken = Deno.env.get("DEBUG_TOKEN");
    const providedToken = req.headers.get("x-debug-token");

    if (!expectedToken || !providedToken || providedToken !== expectedToken) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only return booleans – never surface the actual secret values
    const response = {
      has_razorpay_key_id: Boolean(Deno.env.get("RAZORPAY_KEY_ID")),
      has_razorpay_key_secret: Boolean(Deno.env.get("RAZORPAY_KEY_SECRET")),
      has_supabase_url: Boolean(Deno.env.get("SUPABASE_URL")),
      has_service_role_key: Boolean(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message ?? "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
