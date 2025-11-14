import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    const { endpoint, method, body, token } = await req.json();

    if (!endpoint) {
      return new Response(JSON.stringify({
        error: "Missing endpoint parameter"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!token) {
      return new Response(JSON.stringify({
        error: "Missing Notion access token"
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Build the full Notion API URL
    const notionUrl = `https://api.notion.com/v1${endpoint}`;

    console.log(`Proxying request: ${method || 'GET'} ${notionUrl}`);

    // Make request to Notion API
    const notionResponse = await fetch(notionUrl, {
      method: method || 'GET',
      headers: {
        "Authorization": `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!notionResponse.ok) {
      const errorText = await notionResponse.text();
      console.error(`Notion API error: ${notionResponse.status} ${errorText}`);
      return new Response(JSON.stringify({
        error: "Notion API request failed",
        details: errorText,
        status: notionResponse.status
      }), {
        status: notionResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const data = await notionResponse.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(JSON.stringify({
      error: "Internal proxy error",
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});