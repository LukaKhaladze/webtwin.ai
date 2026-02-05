import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Recommendation = {
  id: string;
  title: string;
  detail: string;
  impact: "good" | "bad" | "improve";
  category: "uiux" | "seo";
};

type ScanResult = {
  targetUrl: string;
  fetchedUrl: string | null;
  score: number;
  summary: string;
  aiUsed?: boolean;
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
    device_scale_factor: isMobile ? "2" : "1",
    format: "png",
    image_quality: "80",
    block_ads: "true",
    block_trackers: "true",
    cache: "false",
    full_page: "true",
  });

  if (isMobile) {
    params.set("is_mobile", "true");
    params.set(
      "user_agent",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
    );
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
      category: "seo",
    });
  }

  if (!checks.metaDescription) {
    recs.push({
      id: "meta-description",
      title: "Meta description needs improvement",
      detail: "Provide a 50-160 character description to improve search snippets and CTR.",
      impact: "improve",
      category: "seo",
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
      category: "seo",
    });
  } else if (checks.h1Count > 1) {
    recs.push({
      id: "multiple-h1",
      title: "Multiple H1 tags",
      detail: "Use a single H1 to keep page hierarchy consistent for SEO and accessibility.",
      impact: "improve",
      category: "seo",
    });
  }

  if (checks.imagesWithoutAlt > 0) {
    recs.push({
      id: "missing-alt",
      title: "Image alt text missing",
      detail: `${checks.imagesWithoutAlt} images are missing alt text. Add alt attributes for accessibility and SEO.`,
      impact: "improve",
      category: "seo",
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
      category: "seo",
    });
  }

  if (checks.h1Count === 1) {
    recs.push({
      id: "single-h1",
      title: "Single main headline",
      detail: "Exactly one H1 found, which helps structure the page for users.",
      impact: "good",
      category: "seo",
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

function summarizeContent(html: string) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch?.[1]?.trim() ?? "";
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "").replace(/<[^>]+>/g, "").trim();
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  const metaDescription = metaDescMatch?.[1]?.trim() ?? "";
  const headings = (html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || [])
    .slice(0, 6)
    .map((h) => h.replace(/<[^>]+>/g, "").trim())
    .filter(Boolean);
  const links = (html.match(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi) || [])
    .slice(0, 10)
    .map((tag) => {
      const href = tag.match(/href=["']([^"']+)["']/i)?.[1] ?? "";
      const text = tag.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      return href || text ? `${text || "link"} -> ${href}` : null;
    })
    .filter(Boolean);
  const textSample = (html.replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim())
    .slice(0, 1200);

  return {
    title,
    h1,
    metaDescription,
    headings,
    links,
    textSample,
  };
}

async function getAiRecommendations(input: ReturnType<typeof summarizeContent>, targetUrl: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const prompt = `You are an expert UI/UX + SEO auditor. Analyze the provided page summary and return JSON ONLY.\n\nReturn JSON with shape:\n{\n  \"summary\": string,\n  \"score\": number (0-100),\n  \"recommendations\": [\n    {\"id\": string, \"title\": string, \"detail\": string, \"impact\": \"good\"|\"bad\"|\"improve\", \"category\": \"uiux\"|\"seo\"}\n  ]\n}\n\nRules:\n- Focus mostly on UI/UX (at least 60% of items UI/UX) and the rest SEO.\n- 6 to 10 total recommendations.\n- Each detail max 240 chars.\n- Be practical and specific.\n\nPAGE URL: ${targetUrl}\nTITLE: ${input.title}\nMETA DESCRIPTION: ${input.metaDescription}\nH1: ${input.h1}\nH2s: ${input.headings.join(\" | \")}\nLINKS (sample): ${input.links.join(\" | \")}\nTEXT SAMPLE: ${input.textSample}\n`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: [{ type: "text", text: prompt }],
        },
      ],
      max_output_tokens: 800,
      temperature: 0.4,
    }),
  });

  if (!response.ok) return null;
  const data = (await response.json()) as { output?: Array<{ content?: Array<{ text?: string }> }> };
  const text = data.output?.[0]?.content?.[0]?.text || "";
  if (!text) return null;

  try {
    return JSON.parse(text) as { summary: string; score: number; recommendations: Recommendation[] };
  } catch {
    return null;
  }
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
  const extracted = summarizeContent(html);
  const ai = await getAiRecommendations(extracted, targetUrl);
  const recommendations = ai?.recommendations?.length ? ai.recommendations : buildRecommendations(checks);
  const score = Number.isFinite(ai?.score) ? Math.round(ai!.score) : computeScore(checks);
  const summary =
    ai?.summary ||
    "Baseline structure analyzed from live HTML. Prioritize missing metadata, responsive setup, and accessibility fixes for immediate gains.";

  const result: ScanResult = {
    targetUrl,
    fetchedUrl,
    score,
    summary,
    aiUsed: Boolean(ai),
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
