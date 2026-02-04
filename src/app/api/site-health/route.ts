import { NextResponse } from "next/server";

export const runtime = "edge";

type LighthouseCategory = "performance" | "seo" | "best-practices";

function normalizeSiteToUrl(site: string) {
  const trimmed = (site || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

async function fetchLighthouseScore(url: string, category: LighthouseCategory) {
  const apiUrl = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  apiUrl.searchParams.set("url", url);
  apiUrl.searchParams.set("category", category);
  apiUrl.searchParams.set("strategy", "mobile");

  const res = await fetch(apiUrl.toString(), {
    cache: "no-store",
    headers: { "User-Agent": "WebTwinAI/1.0" },
  });

  if (!res.ok) return null;
  const json = (await res.json()) as {
    lighthouseResult?: {
      categories?: Record<string, { score?: number }>;
    };
  };

  const score = json.lighthouseResult?.categories?.[category]?.score;
  if (typeof score !== "number") return null;
  return Math.round(score * 100);
}

async function liveUptimeCheck(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
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
      lighthouse: { performance: null, seo: null, bestPractices: null },
      uptime: { isUp: null, statusCode: null, responseMs: null, checkedAt: null },
    });
  }

  const [performance, seo, bestPractices, uptime] = await Promise.all([
    fetchLighthouseScore(targetUrl, "performance"),
    fetchLighthouseScore(targetUrl, "seo"),
    fetchLighthouseScore(targetUrl, "best-practices"),
    liveUptimeCheck(targetUrl),
  ]);

  return NextResponse.json({
    lighthouse: {
      performance,
      seo,
      bestPractices,
    },
    uptime,
  });
}
