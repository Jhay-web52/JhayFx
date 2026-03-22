import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ONESIGNAL_APP_ID = "4de377e6-66d9-4caf-a77b-41bbdaa67248";
const ONESIGNAL_API   = "https://onesignal.com/api/v1/notifications";

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const apiKey = Deno.env.get("ONESIGNAL_API_KEY");
  if (!apiKey) {
    console.error("[send-push] ONESIGNAL_API_KEY secret is not set");
    return new Response(
      JSON.stringify({ error: "Push notifications not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let title: string, message: string, url: string;

  try {
    ({ title, message, url } = await req.json());
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (!title || !message) {
    return new Response(
      JSON.stringify({ error: "title and message are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const notification = {
    app_id:            ONESIGNAL_APP_ID,
    included_segments: ["All"],
    headings:          { en: title },
    contents:          { en: message },
    ...(url ? { url } : {}),
  };

  console.log("[send-push] sending notification", { title, url });

  const res = await fetch(ONESIGNAL_API, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Basic ${apiKey}`,
    },
    body: JSON.stringify(notification),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("[send-push] OneSignal error", { status: res.status, data });
    return new Response(
      JSON.stringify({ error: "OneSignal request failed", details: data }),
      { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  console.log("[send-push] notification sent", { id: data.id, recipients: data.recipients });

  return new Response(
    JSON.stringify({ ok: true, id: data.id, recipients: data.recipients }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
