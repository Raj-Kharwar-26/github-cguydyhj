import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const BREVO_API_URL = "https://api.brevo.com/v3";

interface SendEmailRequest {
  tempEmailId: string;
  to: string;
  subject: string;
  body: string;
  from: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify Brevo API key is available
    if (!BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY is not configured");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { tempEmailId, to, subject, body, from }: SendEmailRequest = await req.json();

    // Verify the temporary email belongs to the authenticated user
    const { data: tempEmail, error: tempEmailError } = await supabase
      .from("temporary_emails")
      .select("*")
      .eq("id", tempEmailId)
      .eq("is_active", true)
      .single();

    if (tempEmailError || !tempEmail) {
      return new Response(
        JSON.stringify({ error: "Temporary email not found or not accessible" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if email is expired
    if (new Date(tempEmail.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Temporary email expired" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Sending email via Brevo:", { to, from, subject });

    // Send email using Brevo API
    const emailResponse = await fetch(`${BREVO_API_URL}/smtp/email`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: {
          email: from,
          name: "Temporary Email"
        },
        to: [{
          email: to
        }],
        subject: subject,
        textContent: body,
        headers: {
          "X-Mailfrom": from,
          "X-TempEmail-ID": tempEmailId
        }
      })
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Brevo API error:", errorData);
      throw new Error(`Brevo API error: ${JSON.stringify(errorData)}`);
    }

    const emailResult = await emailResponse.json();
    console.log("Brevo API response:", emailResult);

    // Store the sent email in the database
    const { data: sentEmail, error: insertError } = await supabase
      .from("emails")
      .insert({
        temporary_email_id: tempEmailId,
        from_address: from,
        to_address: to,
        subject,
        body_text: body,
        email_type: "sent",
        is_sent: true,
        received_at: new Date().toISOString(),
        message_id: emailResult.messageId
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error storing sent email:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to store sent email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: sentEmail.id,
        messageId: emailResult.messageId,
        message: "Email sent successfully via Brevo"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});