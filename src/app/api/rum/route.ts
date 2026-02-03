import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "edge";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
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
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
