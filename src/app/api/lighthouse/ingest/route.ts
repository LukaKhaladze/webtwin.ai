import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "edge";

type Recommendation = {
  key: string;
  title: string;
  detail: string;
  impact: "high" | "medium" | "low";
};

type IngestPayload = {
  site: string;
  strategy: "mobile" | "desktop";
  performance: number | null;
  accessibility: number | null;
  seo: number | null;
  bestPractices: number | null;
  homepageLoadSec: number | null;
  finalUrl: string | null;
  perfRecommendations: Recommendation[];
  seoRecommendations: Recommendation[];
  uiuxRecommendations: Recommendation[];
  checkedAt?: string;
};

export async function POST(request: Request) {
  const token = request.headers.get("x-ingest-token") || "";
  const expectedToken = process.env.LIGHTHOUSE_INGEST_TOKEN || "";

  if (!expectedToken || token !== expectedToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as IngestPayload;
  if (!payload.site || !payload.strategy) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("lighthouse_runs").insert({
    site: payload.site.trim().toLowerCase(),
    strategy: payload.strategy,
    performance: payload.performance,
    accessibility: payload.accessibility,
    seo: payload.seo,
    best_practices: payload.bestPractices,
    homepage_load_sec: payload.homepageLoadSec,
    final_url: payload.finalUrl,
    perf_recommendations: payload.perfRecommendations,
    seo_recommendations: payload.seoRecommendations,
    uiux_recommendations: payload.uiuxRecommendations,
    checked_at: payload.checkedAt || new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "ok" });
}
