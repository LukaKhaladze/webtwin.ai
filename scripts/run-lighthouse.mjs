#!/usr/bin/env node

const target = (process.env.TARGET_SITE || "").trim();
const strategy = (process.env.LH_STRATEGY || "mobile").trim();
const appBaseUrl = (process.env.APP_BASE_URL || "").trim();
const ingestToken = (process.env.LIGHTHOUSE_INGEST_TOKEN || "").trim();

if (!target || !appBaseUrl || !ingestToken) {
  console.error("Missing env vars: TARGET_SITE, APP_BASE_URL, LIGHTHOUSE_INGEST_TOKEN");
  process.exit(1);
}

const site = target.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();
const url = target.startsWith("http") ? target : `https://${site}`;

const { launch } = await import("chrome-launcher");
const { default: lighthouse } = await import("lighthouse");

const chrome = await launch({ chromeFlags: ["--headless", "--no-sandbox", "--disable-dev-shm-usage"] });

try {
  const result = await lighthouse(url, {
    port: chrome.port,
    output: "json",
    logLevel: "error",
    onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    emulatedFormFactor: strategy === "desktop" ? "desktop" : "mobile",
    screenEmulation: strategy === "desktop" ? { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false } : undefined,
  });

  const lhr = result?.lhr;
  if (!lhr) throw new Error("No Lighthouse result");

  const audits = lhr.audits || {};
  const categories = lhr.categories || {};

  const scoreTo100 = (value) => (typeof value === "number" ? Math.round(value * 100) : null);

  const recKeys = {
    perf: ["render-blocking-resources", "unused-javascript", "unused-css-rules", "server-response-time", "offscreen-images"],
    seo: ["document-title", "meta-description", "link-text", "crawlable-anchors", "image-alt", "robots-txt"],
    uiux: ["color-contrast", "tap-targets", "font-size", "cumulative-layout-shift", "viewport"],
  };

  const pick = (keys) =>
    keys
      .map((key) => {
        const a = audits[key];
        if (!a) return null;
        if (a.scoreDisplayMode === "notApplicable") return null;
        if (typeof a.score === "number" && a.score >= 0.9) return null;

        const impact = typeof a.score === "number" && a.score < 0.5 ? "high" : typeof a.score === "number" && a.score < 0.75 ? "medium" : "low";
        return {
          key,
          title: a.title || key,
          detail: a.displayValue || a.description || "Needs attention",
          impact,
        };
      })
      .filter(Boolean)
      .slice(0, 4);

  const payload = {
    site,
    strategy: strategy === "desktop" ? "desktop" : "mobile",
    performance: scoreTo100(categories.performance?.score),
    accessibility: scoreTo100(categories.accessibility?.score),
    seo: scoreTo100(categories.seo?.score),
    bestPractices: scoreTo100(categories["best-practices"]?.score),
    homepageLoadSec:
      typeof audits["largest-contentful-paint"]?.numericValue === "number"
        ? Number((audits["largest-contentful-paint"].numericValue / 1000).toFixed(2))
        : null,
    finalUrl: lhr.finalDisplayedUrl || lhr.finalUrl || url,
    perfRecommendations: pick(recKeys.perf),
    seoRecommendations: pick(recKeys.seo),
    uiuxRecommendations: pick(recKeys.uiux),
    checkedAt: new Date().toISOString(),
  };

  const ingestRes = await fetch(`${appBaseUrl.replace(/\/$/, "")}/api/lighthouse/ingest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ingest-token": ingestToken,
    },
    body: JSON.stringify(payload),
  });

  if (!ingestRes.ok) {
    const text = await ingestRes.text();
    throw new Error(`Ingest failed: ${ingestRes.status} ${text}`);
  }

  console.log("Lighthouse run stored successfully", {
    site,
    strategy,
    performance: payload.performance,
    accessibility: payload.accessibility,
    bestPractices: payload.bestPractices,
    seo: payload.seo,
  });
} finally {
  await chrome.kill();
}
