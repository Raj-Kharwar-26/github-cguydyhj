
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { tempEmailAddress } = await req.json();

    if (!tempEmailAddress) {
      return new Response(
        JSON.stringify({ error: "tempEmailAddress is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the temporary email
    const { data: tempEmail, error: tempEmailError } = await supabase
      .from("temporary_emails")
      .select("*")
      .eq("email_address", tempEmailAddress)
      .eq("is_active", true)
      .single();

    if (tempEmailError || !tempEmail) {
      return new Response(
        JSON.stringify({ error: "Temporary email not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate random test emails
    const sampleSenders = [
      "newsletter@example.com",
      "support@service.com",
      "noreply@company.org",
      "alerts@bank.com",
      "notifications@social.net"
    ];

    const sampleSubjects = [
      "Welcome to our service!",
      "Your account has been verified",
      "Monthly newsletter",
      "Security alert",
      "Special offer just for you",
      "Password reset request",
      "Invoice #12345",
      "Meeting reminder"
    ];

    const sampleBodies = [
      "Thank you for signing up! We're excited to have you on board.",
      "Your account verification is complete. You can now access all features.",
      "Here's what's new this month in our newsletter...",
      "We detected a login from a new device. If this wasn't you, please contact support.",
      "Don't miss out on our special 50% discount offer!",
      "Click here to reset your password: [Reset Link]",
      "Your invoice for this month is ready for download.",
      "Reminder: You have a meeting scheduled for tomorrow at 2 PM."
    ];

    const randomSender = sampleSenders[Math.floor(Math.random() * sampleSenders.length)];
    const randomSubject = sampleSubjects[Math.floor(Math.random() * sampleSubjects.length)];
    const randomBody = sampleBodies[Math.floor(Math.random() * sampleBodies.length)];

    // Insert the simulated email
    const { data: newEmail, error: insertError } = await supabase
      .from("emails")
      .insert({
        temporary_email_id: tempEmail.id,
        from_address: randomSender,
        to_address: tempEmailAddress,
        subject: randomSubject,
        body_text: randomBody,
        email_type: "received",
        is_read: false,
        received_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting simulated email:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create simulated email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        email: newEmail,
        message: "Simulated email created successfully"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in simulate-incoming-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
