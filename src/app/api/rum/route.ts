import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "edge";

function corsHeaders(request: Request) {
  const origin = request.headers.get("origin");
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}

export async function POST(request: Request) {
  let payload: Record<string, unknown> = {};
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch (err) {
    payload = { error: "invalid_json" };
  }

  const supabase = getSupabaseServerClient();
  await supabase.from("rum_events").insert({
    site: payload.site ?? null,
    type: payload.type ?? null,
    url: payload.url ?? null,
    referrer: payload.referrer ?? null,
    user_agent: payload.userAgent ?? null,
    viewport: payload.viewport ?? null,
    vitals: payload.vitals ?? null,
    ts: payload.ts ?? null,
  });

  return NextResponse.json(
    { status: "ok" },
    {
      headers: corsHeaders(request),
    }
  );
}
