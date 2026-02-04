import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "edge";

type Recommendation = {
  key: string;
  title: string;
  detail: string;
  impact: "high" | "medium" | "low";
};

type LighthouseRun = {
  site: string;
  strategy: "mobile" | "desktop";
  performance: number | null;
  accessibility: number | null;
  seo: number | null;
  best_practices: number | null;
  homepage_load_sec: number | null;
  final_url: string | null;
  perf_recommendations: Recommendation[] | null;
  seo_recommendations: Recommendation[] | null;
  uiux_recommendations: Recommendation[] | null;
  checked_at: string;
};

function normalizeSiteToUrl(site: string) {
  const trimmed = (site || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

async function liveUptimeCheck(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const startedAt = Date.now();

  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
      headers: { "User-Agent": "WebTwinAI/1.0" },
    });

    return {
      isUp: res.ok,
      statusCode: res.status,
      responseMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
    };
  } catch {
    return {
      isUp: false,
      statusCode: 0,
      responseMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: Request) {
  const reqUrl = new URL(request.url);
  const site = (reqUrl.searchParams.get("site") || "").trim().toLowerCase();
  const targetUrl = normalizeSiteToUrl(site);

  if (!targetUrl) {
    return NextResponse.json({
      lighthouse: { performance: null, accessibility: null, seo: null, bestPractices: null },
      lighthouseSource: "unavailable (missing site)",
      scanUrl: null,
      homepageLoadSec: null,
      recommendations: { performance: [], seo: [], uiux: [] },
      uptime: { isUp: null, statusCode: null, responseMs: null, checkedAt: null },
    });
  }

  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("lighthouse_runs")
    .select(
      "site,strategy,performance,accessibility,seo,best_practices,homepage_load_sec,final_url,perf_recommendations,seo_recommendations,uiux_recommendations,checked_at"
    )
    .eq("site", site)
    .eq("strategy", "mobile")
    .order("checked_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const latestRun = (data as LighthouseRun | null) ?? null;
  const uptime = await liveUptimeCheck(targetUrl);

  return NextResponse.json({
    lighthouse: {
      performance: latestRun?.performance ?? null,
      accessibility: latestRun?.accessibility ?? null,
      seo: latestRun?.seo ?? null,
      bestPractices: latestRun?.best_practices ?? null,
    },
    lighthouseSource: latestRun ? "self-hosted-lighthouse" : "unavailable (no self-hosted run yet)",
    scanUrl: latestRun?.final_url ?? targetUrl,
    homepageLoadSec: latestRun?.homepage_load_sec ?? null,
    recommendations: {
      performance: latestRun?.perf_recommendations ?? [],
      seo: latestRun?.seo_recommendations ?? [],
      uiux: latestRun?.uiux_recommendations ?? [],
    },
    uptime,
  });
}
