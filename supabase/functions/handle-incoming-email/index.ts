import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BrevoWebhookPayload {
  event: string;
  email: {
    to: Array<{ email: string }>;
    from: Array<{ email: string }>;
    subject: string;
    text: string;
    html?: string;
    date: string;
    messageId: string;
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload: BrevoWebhookPayload = await req.json();
    console.log("Received webhook payload:", payload);

    if (payload.event !== "inboundEmailProcessed") {
      return new Response(
        JSON.stringify({ message: "Ignoring non-inbound email event" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const toAddress = payload.email.to[0].email;
    const fromAddress = payload.email.from[0].email;

    // Find the temporary email address
    const { data: tempEmail, error: tempEmailError } = await supabase
      .from("temporary_emails")
      .select("*")
      .eq("email_address", toAddress)
      .eq("is_active", true)
      .single();

    if (tempEmailError || !tempEmail) {
      console.log("Temporary email not found or inactive:", toAddress);
      return new Response(
        JSON.stringify({ error: "Email address not found or inactive" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if email is expired
    if (new Date(tempEmail.expires_at) < new Date()) {
      console.log("Temporary email expired:", toAddress);
      return new Response(
        JSON.stringify({ error: "Email address expired" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store the email in the database
    const { data: newEmail, error: insertError } = await supabase
      .from("emails")
      .insert({
        temporary_email_id: tempEmail.id,
        from_address: fromAddress,
        to_address: toAddress,
        subject: payload.email.subject,
        body_text: payload.email.text,
        body_html: payload.email.html,
        message_id: payload.email.messageId,
        email_type: "received",
        is_read: false,
        received_at: new Date(payload.email.date).toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting email:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to store email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Email stored successfully:", newEmail.id);

    return new Response(
      JSON.stringify({ success: true, emailId: newEmail.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in handle-incoming-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});