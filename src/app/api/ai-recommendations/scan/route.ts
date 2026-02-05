import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Recommendation = {
  id: string;
  title: string;
  detail: string;
  impact: "good" | "bad" | "improve";
  category: "uiux";
};

type ScanResult = {
  targetUrl: string;
  fetchedUrl: string | null;
  score: number;
  summary: string;
  recommendations: Recommendation[];
  snapshots: {
    mobile: string | null;
    desktop: string | null;
    tablet: string | null;
  };
  checks: {
    title: boolean;
    metaDescription: boolean;
    viewport: boolean;
    h1Count: number;
    imagesWithoutAlt: number;
    emptyLinks: number;
  };
};

function normalizeUrl(input: string) {
  const trimmed = (input || "").trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

function buildSnapshotUrl(targetUrl: string, width: number, height: number, isMobile: boolean) {
  const accessKey = process.env.SCREENSHOTONE_ACCESS_KEY || "";
  const baseUrl = process.env.SCREENSHOTONE_BASE_URL || "https://api.screenshotone.com/take";

  if (!accessKey) return null;

  const params = new URLSearchParams({
    url: targetUrl,
    access_key: accessKey,
    viewport_width: String(width),
    viewport_height: String(height),
    device_scale_factor: "1",
    format: "png",
    image_quality: "80",
    block_ads: "true",
    block_trackers: "true",
    cache: "false",
  });

  if (isMobile) {
    params.set("is_mobile", "true");
  }

  return `${baseUrl}?${params.toString()}`;
}

function extractChecks(html: string) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch?.[1]?.trim() ?? "";
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  const metaDescription = metaDescMatch?.[1]?.trim() ?? "";
  const viewport = /<meta[^>]*name=["']viewport["'][^>]*>/i.test(html);

  const h1Matches = html.match(/<h1[^>]*>/gi) ?? [];
  const h1Count = h1Matches.length;

  const imgTags = html.match(/<img[^>]*>/gi) ?? [];
  const imagesWithoutAlt = imgTags.filter((tag) => !/alt=["'][^"']+["']/i.test(tag)).length;

  const linkTags = html.match(/<a[^>]*>([\s\S]*?)<\/a>/gi) ?? [];
  const emptyLinks = linkTags.filter((tag) => {
    const text = tag.replace(/<[^>]+>/g, "").trim();
    return text.length === 0;
  }).length;

  return {
    title: Boolean(title),
    metaDescription: metaDescription.length >= 50 && metaDescription.length <= 160,
    viewport,
    h1Count,
    imagesWithoutAlt,
    emptyLinks,
  };
}

function buildRecommendations(checks: ReturnType<typeof extractChecks>) {
  const recs: Recommendation[] = [];

  if (!checks.title) {
    recs.push({
      id: "missing-title",
      title: "Missing page title",
      detail: "Add a descriptive <title> tag to improve SEO and clarity in browser tabs.",
      impact: "bad",
      category: "uiux",
    });
  }

  if (!checks.metaDescription) {
    recs.push({
      id: "meta-description",
      title: "Meta description needs improvement",
      detail: "Provide a 50-160 character description to improve search snippets and CTR.",
      impact: "improve",
      category: "uiux",
    });
  }

  if (!checks.viewport) {
    recs.push({
      id: "viewport-meta",
      title: "Missing viewport meta tag",
      detail: "Add a responsive viewport meta tag to ensure proper mobile scaling.",
      impact: "bad",
      category: "uiux",
    });
  }

  if (checks.h1Count === 0) {
    recs.push({
      id: "missing-h1",
      title: "Missing main H1",
      detail: "Add a clear H1 headline to define the primary page topic.",
      impact: "improve",
      category: "uiux",
    });
  } else if (checks.h1Count > 1) {
    recs.push({
      id: "multiple-h1",
      title: "Multiple H1 tags",
      detail: "Use a single H1 to keep page hierarchy consistent for SEO and accessibility.",
      impact: "improve",
      category: "uiux",
    });
  }

  if (checks.imagesWithoutAlt > 0) {
    recs.push({
      id: "missing-alt",
      title: "Image alt text missing",
      detail: `${checks.imagesWithoutAlt} images are missing alt text. Add alt attributes for accessibility and SEO.`,
      impact: "improve",
      category: "uiux",
    });
  }

  if (checks.emptyLinks > 0) {
    recs.push({
      id: "empty-links",
      title: "Links without descriptive text",
      detail: `${checks.emptyLinks} links have no text. Add visible labels for accessibility.`,
      impact: "improve",
      category: "uiux",
    });
  }

  if (checks.viewport) {
    recs.push({
      id: "viewport-good",
      title: "Responsive viewport detected",
      detail: "Viewport meta tag is set correctly for mobile scaling.",
      impact: "good",
      category: "uiux",
    });
  }

  if (checks.title) {
    recs.push({
      id: "title-good",
      title: "Clear page title",
      detail: "Page title is present and readable in browser tabs.",
      impact: "good",
      category: "uiux",
    });
  }

  if (checks.h1Count === 1) {
    recs.push({
      id: "single-h1",
      title: "Single main headline",
      detail: "Exactly one H1 found, which helps structure the page for users.",
      impact: "good",
      category: "uiux",
    });
  }

  if (recs.length === 0) {
    recs.push({
      id: "clean-ui",
      title: "Solid baseline structure",
      detail: "Core structural checks look good. Focus on content hierarchy and performance tuning.",
      impact: "good",
      category: "uiux",
    });
  }

  return recs;
}

function computeScore(checks: ReturnType<typeof extractChecks>) {
  let score = 100;
  if (!checks.title) score -= 12;
  if (!checks.metaDescription) score -= 10;
  if (!checks.viewport) score -= 18;
  if (checks.h1Count === 0) score -= 10;
  if (checks.h1Count > 1) score -= 6;
  score -= Math.min(checks.imagesWithoutAlt * 2, 12);
  score -= Math.min(checks.emptyLinks * 2, 10);
  return Math.max(30, Math.min(100, Math.round(score)));
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { url?: string };
  const targetUrl = normalizeUrl(body.url || "");

  if (!targetUrl) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  let html = "";
  let fetchedUrl: string | null = null;

  try {
    const res = await fetch(targetUrl, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": "WebTwinAI/1.0" },
    });
    html = await res.text();
    fetchedUrl = res.url || targetUrl;
  } catch {
    html = "";
    fetchedUrl = null;
  }

  const checks = extractChecks(html);
  const recommendations = buildRecommendations(checks);
  const score = computeScore(checks);

  const summary = "Baseline structure analyzed from live HTML. Prioritize missing metadata, responsive setup, and accessibility fixes for immediate gains.";

  const result: ScanResult = {
    targetUrl,
    fetchedUrl,
    score,
    summary,
    recommendations,
    snapshots: {
      mobile: buildSnapshotUrl(targetUrl, 390, 844, true),
      desktop: buildSnapshotUrl(targetUrl, 1440, 900, false),
      tablet: buildSnapshotUrl(targetUrl, 820, 1180, false),
    },
    checks,
  };

  return NextResponse.json(result);
}
