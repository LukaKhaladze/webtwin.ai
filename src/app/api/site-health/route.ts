import { NextResponse } from "next/server";

export const runtime = "edge";

function normalizeSiteToUrl(site: string) {
  const trimmed = (site || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

async function fetchLighthouseScores(url: string) {
  const apiUrl = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  apiUrl.searchParams.set("url", url);
  apiUrl.searchParams.set("strategy", "mobile");
  if (process.env.PAGESPEED_API_KEY) {
    apiUrl.searchParams.set("key", process.env.PAGESPEED_API_KEY);
  }

  const res = await fetch(apiUrl.toString(), {
    cache: "no-store",
    headers: { "User-Agent": "WebTwinAI/1.0" },
  });

  if (!res.ok) {
    return {
      performance: null,
      accessibility: null,
      seo: null,
      bestPractices: null,
      source: `unavailable (${res.status})`,
    };
  }

  const json = (await res.json()) as {
    lighthouseResult?: {
      categories?: {
        performance?: { score?: number };
        accessibility?: { score?: number };
        seo?: { score?: number };
        "best-practices"?: { score?: number };
      };
    };
    error?: {
      message?: string;
    };
  };
  if (json.error?.message) {
    return {
      performance: null,
      accessibility: null,
      seo: null,
      bestPractices: null,
      source: `unavailable (${json.error.message})`,
    };
  }

  const categories = json.lighthouseResult?.categories;
  const performance = categories?.performance?.score;
  const accessibility = categories?.accessibility?.score;
  const seo = categories?.seo?.score;
  const bestPractices = categories?.["best-practices"]?.score;

  return {
    performance: typeof performance === "number" ? Math.round(performance * 100) : null,
    accessibility: typeof accessibility === "number" ? Math.round(accessibility * 100) : null,
    seo: typeof seo === "number" ? Math.round(seo * 100) : null,
    bestPractices: typeof bestPractices === "number" ? Math.round(bestPractices * 100) : null,
    source: "pagespeed",
  };
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
  const site = reqUrl.searchParams.get("site") || "";
  const targetUrl = normalizeSiteToUrl(site);

  if (!targetUrl) {
    return NextResponse.json({
      lighthouse: { performance: null, accessibility: null, seo: null, bestPractices: null },
      lighthouseSource: "unavailable (missing site)",
      uptime: { isUp: null, statusCode: null, responseMs: null, checkedAt: null },
    });
  }

  const [lighthouse, uptime] = await Promise.all([fetchLighthouseScores(targetUrl), liveUptimeCheck(targetUrl)]);

  return NextResponse.json({
    lighthouse: {
      performance: lighthouse.performance,
      accessibility: lighthouse.accessibility,
      seo: lighthouse.seo,
      bestPractices: lighthouse.bestPractices,
    },
    lighthouseSource: lighthouse.source,
    uptime,
  });
}
