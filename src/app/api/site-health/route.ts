import { NextResponse } from "next/server";

export const runtime = "edge";

type LighthouseCategoryKey = "performance" | "accessibility" | "seo" | "best-practices";

type LighthouseAudit = {
  title?: string;
  description?: string;
  score?: number | null;
  scoreDisplayMode?: string;
  displayValue?: string;
  numericValue?: number;
};

type LighthouseResponse = {
  lighthouseResult?: {
    categories?: Partial<Record<LighthouseCategoryKey, { score?: number }>>;
    audits?: Record<string, LighthouseAudit>;
    finalUrl?: string;
  };
  error?: {
    message?: string;
  };
};

type Recommendation = {
  key: string;
  title: string;
  detail: string;
  impact: "high" | "medium" | "low";
};

function normalizeSiteToUrl(site: string) {
  const trimmed = (site || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

function scoreToPercent(score?: number) {
  if (typeof score !== "number") return null;
  return Math.round(score * 100);
}

function pickRecommendations(
  audits: Record<string, LighthouseAudit> | undefined,
  keys: string[],
  fallbackImpact: Recommendation["impact"]
): Recommendation[] {
  if (!audits) return [];

  return keys
    .map((key) => {
      const audit = audits[key];
      if (!audit) return null;

      const failed = audit.scoreDisplayMode !== "notApplicable" && typeof audit.score === "number" && audit.score < 0.9;
      if (!failed) return null;

      const impact: Recommendation["impact"] =
        typeof audit.score === "number" && audit.score < 0.5
          ? "high"
          : typeof audit.score === "number" && audit.score < 0.75
            ? "medium"
            : fallbackImpact;

      return {
        key,
        title: audit.title || key,
        detail: audit.displayValue || audit.description || "Needs attention.",
        impact,
      };
    })
    .filter(Boolean) as Recommendation[];
}

async function fetchLighthouse(url: string) {
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
      lighthouse: {
        performance: null,
        accessibility: null,
        seo: null,
        bestPractices: null,
      },
      scanUrl: url,
      homepageLoadSec: null,
      recommendations: {
        performance: [] as Recommendation[],
        seo: [] as Recommendation[],
        uiux: [] as Recommendation[],
      },
      source: `unavailable (${res.status})`,
    };
  }

  const json = (await res.json()) as LighthouseResponse;
  if (json.error?.message) {
    return {
      lighthouse: {
        performance: null,
        accessibility: null,
        seo: null,
        bestPractices: null,
      },
      scanUrl: url,
      homepageLoadSec: null,
      recommendations: {
        performance: [] as Recommendation[],
        seo: [] as Recommendation[],
        uiux: [] as Recommendation[],
      },
      source: `unavailable (${json.error.message})`,
    };
  }

  const categories = json.lighthouseResult?.categories;
  const audits = json.lighthouseResult?.audits;

  const homepageLoadMs =
    (typeof audits?.["largest-contentful-paint"]?.score === "number" &&
      typeof audits?.["largest-contentful-paint"]?.numericValue === "number" &&
      audits?.["largest-contentful-paint"]?.numericValue) ||
    (typeof audits?.interactive?.numericValue === "number" && audits?.interactive?.numericValue) ||
    null;

  const perfRecommendations = pickRecommendations(
    audits,
    [
      "render-blocking-resources",
      "unused-javascript",
      "unused-css-rules",
      "server-response-time",
      "offscreen-images",
      "legacy-javascript",
    ],
    "medium"
  );

  const seoRecommendations = pickRecommendations(
    audits,
    [
      "document-title",
      "meta-description",
      "link-text",
      "crawlable-anchors",
      "image-alt",
      "robots-txt",
      "hreflang",
    ],
    "medium"
  );

  const uiuxRecommendations = pickRecommendations(
    audits,
    [
      "color-contrast",
      "tap-targets",
      "font-size",
      "cumulative-layout-shift",
      "is-crawlable",
      "viewport",
    ],
    "medium"
  );

  return {
    lighthouse: {
      performance: scoreToPercent(categories?.performance?.score),
      accessibility: scoreToPercent(categories?.accessibility?.score),
      seo: scoreToPercent(categories?.seo?.score),
      bestPractices: scoreToPercent(categories?.["best-practices"]?.score),
    },
    scanUrl: json.lighthouseResult?.finalUrl || url,
    homepageLoadSec: typeof homepageLoadMs === "number" ? Number((homepageLoadMs / 1000).toFixed(2)) : null,
    recommendations: {
      performance: perfRecommendations.slice(0, 4),
      seo: seoRecommendations.slice(0, 4),
      uiux: uiuxRecommendations.slice(0, 4),
    },
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
      scanUrl: null,
      homepageLoadSec: null,
      recommendations: { performance: [], seo: [], uiux: [] },
      uptime: { isUp: null, statusCode: null, responseMs: null, checkedAt: null },
    });
  }

  const [lighthouse, uptime] = await Promise.all([fetchLighthouse(targetUrl), liveUptimeCheck(targetUrl)]);

  return NextResponse.json({
    lighthouse: lighthouse.lighthouse,
    lighthouseSource: lighthouse.source,
    scanUrl: lighthouse.scanUrl,
    homepageLoadSec: lighthouse.homepageLoadSec,
    recommendations: lighthouse.recommendations,
    uptime,
  });
}
