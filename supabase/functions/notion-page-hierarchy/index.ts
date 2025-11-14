import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PageHierarchyRequest {
  pageId: string;
  token: string;
  maxDepth?: number;
  forceRefresh?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase configuration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { pageId, token: notionToken, maxDepth = 2, forceRefresh = false }: PageHierarchyRequest = await req.json();

    if (!pageId || !notionToken) {
      return new Response(
        JSON.stringify({ error: "Missing pageId or notionToken" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!forceRefresh) {
      const { data: cachedPage } = await supabase
        .from("notion_pages")
        .select("*")
        .eq("user_id", user.id)
        .eq("page_id", pageId)
        .single();

      if (cachedPage && cachedPage.last_synced) {
        const lastSynced = new Date(cachedPage.last_synced);
        const now = new Date();
        const minutesSinceSync = (now.getTime() - lastSynced.getTime()) / 1000 / 60;

        if (minutesSinceSync < 30) {
          const { data: children } = await supabase
            .from("notion_pages")
            .select("*")
            .eq("user_id", user.id)
            .eq("parent_id", pageId)
            .order("title");

          return new Response(
            JSON.stringify({
              ...cachedPage,
              children: children || [],
              fromCache: true,
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }
    }

    const pageResponse = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      headers: {
        Authorization: `Bearer ${notionToken}`,
        "Notion-Version": "2022-06-28",
      },
    });

    if (!pageResponse.ok) {
      const errorText = await pageResponse.text();
      return new Response(
        JSON.stringify({ error: "Failed to fetch page from Notion", details: errorText }),
        { status: pageResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pageData = await pageResponse.json();
    const titleProperty = Object.values(pageData.properties || {}).find(
      (prop: any) => prop.type === "title"
    ) as any;

    const title = titleProperty?.title?.[0]?.plain_text || "Untitled";
    const icon = extractIcon(pageData.icon);

    const blocksResponse = await fetch(
      `https://api.notion.com/v1/blocks/${pageId}/children`,
      {
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Notion-Version": "2022-06-28",
        },
      }
    );

    const blocksData = await blocksResponse.json();
    const childPageBlocks = blocksData.results?.filter(
      (block: any) => block.type === "child_page"
    ) || [];

    const hasChildren = childPageBlocks.length > 0;
    const childCount = childPageBlocks.length;

    await supabase
      .from("notion_pages")
      .upsert({
        user_id: user.id,
        page_id: pageId,
        parent_id: null,
        title,
        icon,
        has_children: hasChildren,
        child_count: childCount,
        depth_level: 0,
        object_type: "page",
        notion_url: pageData.url,
        last_synced: new Date().toISOString(),
      }, {
        onConflict: "user_id,page_id",
      });

    await supabase
      .from("notion_page_cache")
      .upsert({
        user_id: user.id,
        page_id: pageId,
        content_json: pageData,
        blocks_json: blocksData,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      }, {
        onConflict: "user_id,page_id",
      });

    const children = [];
    if (maxDepth > 0 && childPageBlocks.length > 0) {
      for (const childBlock of childPageBlocks.slice(0, 10)) {
        try {
          const childPageResponse = await fetch(
            `https://api.notion.com/v1/pages/${childBlock.id}`,
            {
              headers: {
                Authorization: `Bearer ${notionToken}`,
                "Notion-Version": "2022-06-28",
              },
            }
          );

          if (childPageResponse.ok) {
            const childPageData = await childPageResponse.json();
            const childTitleProp = Object.values(childPageData.properties || {}).find(
              (prop: any) => prop.type === "title"
            ) as any;

            const childTitle = childTitleProp?.title?.[0]?.plain_text ||
                              childBlock.child_page?.title ||
                              "Untitled";

            await supabase
              .from("notion_pages")
              .upsert({
                user_id: user.id,
                page_id: childBlock.id,
                parent_id: pageId,
                title: childTitle,
                icon: extractIcon(childPageData.icon),
                has_children: false,
                child_count: 0,
                depth_level: 1,
                object_type: "page",
                notion_url: childPageData.url,
                last_synced: new Date().toISOString(),
              }, {
                onConflict: "user_id,page_id",
              });

            children.push({
              id: childBlock.id,
              title: childTitle,
              icon: extractIcon(childPageData.icon),
              url: childPageData.url,
              parentId: pageId,
              hasChildren: false,
            });
          }
        } catch (error) {
          console.error(`Failed to fetch child page ${childBlock.id}:`, error);
        }
      }
    }

    return new Response(
      JSON.stringify({
        id: pageId,
        title,
        icon,
        url: pageData.url,
        hasChildren,
        childCount,
        children,
        fromCache: false,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Hierarchy fetch error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function extractIcon(icon: any): string | undefined {
  if (!icon) return undefined;
  if (icon.type === "emoji") return icon.emoji;
  if (icon.type === "external" && icon.external?.url) return "🔗";
  if (icon.type === "file" && icon.file?.url) return "📄";
  return undefined;
}
