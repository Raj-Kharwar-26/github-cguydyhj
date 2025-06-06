import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const BREVO_API_URL = "https://api.brevo.com/v3";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { address } = await req.json();

    if (!address) {
      return new Response(
        JSON.stringify({ error: "Email address is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create webhook in Brevo
    const webhookResponse = await fetch(`${BREVO_API_URL}/webhooks`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY!
      },
      body: JSON.stringify({
        type: "inbound",
        events: ["inboundEmailProcessed"],
        url: `${Deno.env.get("SUPABASE_FUNCTIONS_URL")}/handle-incoming-email`,
        description: `Webhook for ${address}`
      })
    });

    if (!webhookResponse.ok) {
      const error = await webhookResponse.json();
      throw new Error(`Failed to create Brevo webhook: ${JSON.stringify(error)}`);
    }

    const webhook = await webhookResponse.json();

    // Update mailbox with webhook ID
    const { error: updateError } = await supabase
      .from("mailboxes")
      .update({ webhook_id: webhook.id })
      .eq("address", address);

    if (updateError) {
      throw new Error(`Failed to update mailbox: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, webhook }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in setup-brevo-webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});