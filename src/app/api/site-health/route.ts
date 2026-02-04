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

type StrategySnapshot = {
  performance: number | null;
  accessibility: number | null;
  seo: number | null;
  bestPractices: number | null;
  homepageLoadSec: number | null;
  finalUrl: string | null;
  checkedAt: string | null;
  recommendations: {
    performance: Recommendation[];
    seo: Recommendation[];
    uiux: Recommendation[];
  };
};

type RobotsStatus = {
  url: string;
  exists: boolean;
  valid: boolean;
  statusCode: number;
};

function normalizeSiteToUrl(site: string) {
  const trimmed = (site || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

function toSiteKeys(rawSite: string) {
  const normalizedUrl = normalizeSiteToUrl(rawSite);
  if (!normalizedUrl) return [];

  try {
    const hostname = new URL(normalizedUrl).hostname.toLowerCase();
    const withoutWww = hostname.replace(/^www\./, "");
    const withWww = hostname.startsWith("www.") ? hostname : `www.${hostname}`;
    return Array.from(new Set([hostname, withoutWww, withWww]));
  } catch {
    const lowered = rawSite.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!lowered) return [];
    const withoutWww = lowered.replace(/^www\./, "");
    const withWww = lowered.startsWith("www.") ? lowered : `www.${lowered}`;
    return Array.from(new Set([lowered, withoutWww, withWww]));
  }
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

async function checkRobotsTxt(url: string): Promise<RobotsStatus> {
  const target = new URL(url);
  const robotsUrl = `${target.protocol}//${target.hostname}/robots.txt`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(robotsUrl, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: { "User-Agent": "WebTwinAI/1.0" },
    });

    const text = await res.text();
    const hasUserAgent = /(^|\n)\s*user-agent\s*:/i.test(text);
    const exists = res.status >= 200 && res.status < 300;

    return {
      url: robotsUrl,
      exists,
      valid: exists && hasUserAgent,
      statusCode: res.status,
    };
  } catch {
    return {
      url: robotsUrl,
      exists: false,
      valid: false,
      statusCode: 0,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: Request) {
  const reqUrl = new URL(request.url);
  const site = (reqUrl.searchParams.get("site") || "").trim().toLowerCase();
  const siteKeys = toSiteKeys(site);
  const targetUrl = normalizeSiteToUrl(site);

  if (!targetUrl) {
    return NextResponse.json({
      lighthouse: {
        mobile: { performance: null, accessibility: null, seo: null, bestPractices: null },
        desktop: { performance: null, accessibility: null, seo: null, bestPractices: null },
      },
      lighthouseSource: "unavailable (missing site)",
      scanUrl: null,
      homepageLoadSec: { mobile: null, desktop: null },
      recommendations: { performance: [], seo: [], uiux: [] },
      uptime: { isUp: null, statusCode: null, responseMs: null, checkedAt: null },
      robots: { url: null, exists: false, valid: false, statusCode: 0 },
    });
  }

  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("lighthouse_runs")
    .select(
      "site,strategy,performance,accessibility,seo,best_practices,homepage_load_sec,final_url,perf_recommendations,seo_recommendations,uiux_recommendations,checked_at"
    )
    .in("site", siteKeys.length ? siteKeys : [site])
    .order("checked_at", { ascending: false })
    .limit(20);

  const runs = (data as LighthouseRun[] | null) ?? [];
  const latestMobile = runs.find((row) => row.strategy === "mobile") ?? null;
  const latestDesktop = runs.find((row) => row.strategy === "desktop") ?? null;

  const mapRun = (run: LighthouseRun | null): StrategySnapshot => ({
    performance: run?.performance ?? null,
    accessibility: run?.accessibility ?? null,
    seo: run?.seo ?? null,
    bestPractices: run?.best_practices ?? null,
    homepageLoadSec: run?.homepage_load_sec ?? null,
    finalUrl: run?.final_url ?? null,
    checkedAt: run?.checked_at ?? null,
    recommendations: {
      performance: run?.perf_recommendations ?? [],
      seo: run?.seo_recommendations ?? [],
      uiux: run?.uiux_recommendations ?? [],
    },
  });

  const mobile = mapRun(latestMobile);
  const desktop = mapRun(latestDesktop);
  const hasAnyRun = Boolean(latestMobile || latestDesktop);
  const selectedRecommendations = latestMobile ? mobile.recommendations : desktop.recommendations;
  const sanitizedSeoRecommendations = selectedRecommendations.seo.filter((rec) => {
    const key = rec.key.toLowerCase();
    const title = rec.title.toLowerCase();
    return key !== "robots-txt" && !title.includes("robots.txt");
  });
  const [uptime, robots] = await Promise.all([liveUptimeCheck(targetUrl), checkRobotsTxt(targetUrl)]);

  return NextResponse.json({
    lighthouse: {
      mobile: {
        performance: mobile.performance,
        accessibility: mobile.accessibility,
        seo: mobile.seo,
        bestPractices: mobile.bestPractices,
      },
      desktop: {
        performance: desktop.performance,
        accessibility: desktop.accessibility,
        seo: desktop.seo,
        bestPractices: desktop.bestPractices,
      },
    },
    lighthouseSource: hasAnyRun ? "self-hosted-lighthouse" : "unavailable (no self-hosted run yet)",
    scanUrl: mobile.finalUrl ?? desktop.finalUrl ?? targetUrl,
    homepageLoadSec: {
      mobile: mobile.homepageLoadSec,
      desktop: desktop.homepageLoadSec,
    },
    recommendations: {
      performance: selectedRecommendations.performance,
      seo: robots.valid ? sanitizedSeoRecommendations : selectedRecommendations.seo,
      uiux: selectedRecommendations.uiux,
    },
    uptime,
    robots,
  });
}
