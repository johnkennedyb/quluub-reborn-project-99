
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    // Use the provided Paystack secret key
    const paystackSecretKey = "sk_live_92f26ac052547db6826c7f7a471c5ea72e4004b6";

    // Create Paystack payment
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: 500000, // 5000 NGN in kobo
        currency: "NGN",
        callback_url: `${req.headers.get("origin")}/settings?payment=success`,
        metadata: {
          user_id: user.id,
          user_email: user.email,
          plan: "premium"
        },
      }),
    });

    const paymentData = await response.json();
    console.log('Paystack response:', paymentData);

    if (!paymentData.status) {
      throw new Error(paymentData.message || "Failed to create payment");
    }

    return new Response(JSON.stringify({ 
      authorization_url: paymentData.data.authorization_url,
      reference: paymentData.data.reference 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
