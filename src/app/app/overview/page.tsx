"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type OverviewEvent = {
  site?: string | null;
  url: string | null;
  vitals: { domContentLoaded?: number; load?: number } | null;
};

type OverviewResponse = {
  events: OverviewEvent[];
};

type Recommendation = {
  key: string;
  title: string;
  detail: string;
  impact: "high" | "medium" | "low";
};

type SiteHealthResponse = {
  lighthouse: {
    mobile: {
      performance: number | null;
      accessibility: number | null;
      seo: number | null;
      bestPractices: number | null;
    };
    desktop: {
      performance: number | null;
      accessibility: number | null;
      seo: number | null;
      bestPractices: number | null;
    };
  };
  lighthouseSource?: string;
  scanUrl: string | null;
  homepageLoadSec: {
    mobile: number | null;
    desktop: number | null;
  };
  recommendations: {
    performance: Recommendation[];
    seo: Recommendation[];
    uiux: Recommendation[];
  };
  uptime: {
    isUp: boolean | null;
    statusCode: number | null;
    responseMs: number | null;
    checkedAt: string | null;
  };
};

function formatNumber(value: number, suffix = "") {
  if (!Number.isFinite(value)) return "-";
  return `${value.toFixed(1)}${suffix}`;
}

function formatScore(value: number | null) {
  if (value === null) return "--";
  return `${value}/100`;
}

function impactClasses(impact: Recommendation["impact"]) {
  if (impact === "high") return "bg-rose-500/20 text-rose-200";
  if (impact === "medium") return "bg-amber-500/20 text-amber-200";
  return "bg-emerald-500/20 text-emerald-200";
}

type ConfidenceLevel = "high" | "medium" | "low";

function confidenceChipClasses(level: ConfidenceLevel) {
  if (level === "high") return "bg-emerald-500/20 text-emerald-200 border-emerald-500/30";
  if (level === "medium") return "bg-amber-500/20 text-amber-200 border-amber-500/30";
  return "bg-rose-500/20 text-rose-200 border-rose-500/30";
}

export default function OverviewPage() {
  const [siteInput, setSiteInput] = useState("");
  const [siteFilter, setSiteFilter] = useState("");
  const [siteHealth, setSiteHealth] = useState<SiteHealthResponse | null>(null);
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>("");

  const fetchOverview = (site: string) => {
    const query = site ? `?site=${encodeURIComponent(site)}` : "";
    return fetch(`/api/overview${query}`)
      .then((res) => res.json())
      .then((json) => setOverview(json as OverviewResponse));
  };

  const fetchSiteHealth = (site: string) => {
    const query = site ? `?site=${encodeURIComponent(site)}` : "";
    return fetch(`/api/site-health${query}`)
      .then((res) => res.json())
      .then((json) => setSiteHealth(json as SiteHealthResponse));
  };

  const runScan = async (site: string, queueLighthouse = false) => {
    if (!site) return;
    setLoading(true);
    setSiteFilter(site);
    localStorage.setItem("webtwin.activeSite", site);
    try {
      if (queueLighthouse) {
        const dispatchRes = await fetch("/api/lighthouse/dispatch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ site, strategy: "both" }),
        });
        const dispatchJson = (await dispatchRes.json().catch(() => ({}))) as { error?: string; status?: string };
        if (!dispatchRes.ok) {
          setScanStatus(dispatchJson.error || "Failed to queue Lighthouse scan.");
        } else {
          setScanStatus("Lighthouse scan queued (mobile + desktop). Refresh in 1-2 minutes.");
        }
      }
      await Promise.all([fetchOverview(site), fetchSiteHealth(site)]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("site")?.trim() || "";
    const saved = (localStorage.getItem("webtwin.activeSite") || "").trim();
    const site = fromUrl || saved;
    if (!site) return;
    setSiteInput(site);
    setSiteFilter(site);
    localStorage.setItem("webtwin.activeSite", site);
    setLoading(true);
    Promise.all([fetchOverview(site), fetchSiteHealth(site)]).finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => overview?.events ?? [], [overview]);

  const rumConfidence: ConfidenceLevel = rows.length >= 10 ? "high" : rows.length >= 3 ? "medium" : "low";
  const lighthouseConfidence: ConfidenceLevel =
    siteHealth?.lighthouse.mobile.performance != null || siteHealth?.lighthouse.desktop.performance != null ? "medium" : "low";
  const uptimeConfidence: ConfidenceLevel = siteHealth?.uptime.checkedAt ? "high" : "low";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = siteInput.trim().toLowerCase();
    if (!normalized) return;

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("site", normalized);
    window.history.replaceState({}, "", nextUrl.toString());

    await runScan(normalized, true);
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Overview</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Website Health Scan</h1>
        <form className="mt-4 flex flex-wrap items-center gap-3" onSubmit={handleSubmit}>
          <input
            className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white placeholder:text-slate-500"
            value={siteInput}
            onChange={(e) => setSiteInput(e.target.value)}
            placeholder="Enter website URL or domain (e.g. hsetrainings.ge)"
          />
          <button
            type="submit"
            className={`rounded-full px-4 py-2 text-xs font-semibold ${loading ? "bg-slate-700 text-slate-300" : "bg-emerald-500 text-slate-900 hover:bg-emerald-400"}`}
          >
            {loading ? "Scanning..." : "Scan Website"}
          </button>
          {siteFilter && <span className="text-xs text-slate-400">Target: {siteFilter}</span>}
        </form>
        <p className="mt-3 text-sm text-slate-300">
          Exact scanned page: <span className="font-medium text-white">{siteHealth?.scanUrl || "--"}</span>
        </p>
        {scanStatus && <p className="mt-2 text-xs text-emerald-300">{scanStatus}</p>}
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Performance</p>
            <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase ${confidenceChipClasses(lighthouseConfidence)}`}>
              {lighthouseConfidence} confidence
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Mobile</p>
              <p className="mt-1 text-2xl font-semibold text-white">{formatScore(siteHealth?.lighthouse.mobile.performance ?? null)}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Desktop</p>
              <p className="mt-1 text-2xl font-semibold text-white">{formatScore(siteHealth?.lighthouse.desktop.performance ?? null)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Accessibility</p>
            <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase ${confidenceChipClasses(lighthouseConfidence)}`}>
              {lighthouseConfidence} confidence
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Mobile</p>
              <p className="mt-1 text-2xl font-semibold text-white">{formatScore(siteHealth?.lighthouse.mobile.accessibility ?? null)}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Desktop</p>
              <p className="mt-1 text-2xl font-semibold text-white">{formatScore(siteHealth?.lighthouse.desktop.accessibility ?? null)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Best Practices</p>
            <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase ${confidenceChipClasses(lighthouseConfidence)}`}>
              {lighthouseConfidence} confidence
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Mobile</p>
              <p className="mt-1 text-2xl font-semibold text-white">{formatScore(siteHealth?.lighthouse.mobile.bestPractices ?? null)}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Desktop</p>
              <p className="mt-1 text-2xl font-semibold text-white">{formatScore(siteHealth?.lighthouse.desktop.bestPractices ?? null)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">SEO</p>
            <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase ${confidenceChipClasses(lighthouseConfidence)}`}>
              {lighthouseConfidence} confidence
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Mobile</p>
              <p className="mt-1 text-2xl font-semibold text-white">{formatScore(siteHealth?.lighthouse.mobile.seo ?? null)}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Desktop</p>
              <p className="mt-1 text-2xl font-semibold text-white">{formatScore(siteHealth?.lighthouse.desktop.seo ?? null)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Load Time</p>
            <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase ${confidenceChipClasses(lighthouseConfidence)}`}>
              {lighthouseConfidence} confidence
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Mobile</p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {siteHealth?.homepageLoadSec.mobile == null ? "--" : `${siteHealth.homepageLoadSec.mobile}s`}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Desktop</p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {siteHealth?.homepageLoadSec.desktop == null ? "--" : `${siteHealth.homepageLoadSec.desktop}s`}
              </p>
            </div>
          </div>
          <p className="mt-2 text-sm text-slate-400">Estimated homepage load time (synthetic scan).</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Uptime / Downtime</p>
            <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase ${confidenceChipClasses(uptimeConfidence)}`}>
              {uptimeConfidence} confidence
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold text-white">
            {siteHealth?.uptime.isUp == null ? "--" : siteHealth.uptime.isUp ? "UP" : "DOWN"}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            {(siteHealth?.uptime.responseMs ?? 0) > 0
              ? `${siteHealth?.uptime.responseMs}ms • HTTP ${siteHealth?.uptime.statusCode ?? "-"}`
              : "Live status check"}
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-white">Load Speed Recommendations</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            {(siteHealth?.recommendations.performance ?? []).length === 0 && (
              <li className="text-slate-500">No major speed issues detected.</li>
            )}
            {(siteHealth?.recommendations.performance ?? []).map((rec) => (
              <li key={rec.key} className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-white">{rec.title}</p>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${impactClasses(rec.impact)}`}>
                    {rec.impact}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{rec.detail}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-white">SEO Problems & Recommendations</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            {(siteHealth?.recommendations.seo ?? []).length === 0 && (
              <li className="text-slate-500">No critical SEO problems detected.</li>
            )}
            {(siteHealth?.recommendations.seo ?? []).map((rec) => (
              <li key={rec.key} className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-white">{rec.title}</p>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${impactClasses(rec.impact)}`}>
                    {rec.impact}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{rec.detail}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-white">UI/UX Problems & Recommendations</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            {(siteHealth?.recommendations.uiux ?? []).length === 0 && (
              <li className="text-slate-500">No major UI/UX issues detected.</li>
            )}
            {(siteHealth?.recommendations.uiux ?? []).map((rec) => (
              <li key={rec.key} className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-white">{rec.title}</p>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${impactClasses(rec.impact)}`}>
                    {rec.impact}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{rec.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {siteHealth?.lighthouseSource?.startsWith("unavailable") && (
        <p className="text-xs text-amber-300">Scan warning: {siteHealth.lighthouseSource}</p>
      )}

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-white">Latest Captured Events</h2>
          <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase ${confidenceChipClasses(rumConfidence)}`}>
            {rumConfidence} confidence
          </span>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-4 py-3">URL</th>
                <th className="px-4 py-3">DCL</th>
                <th className="px-4 py-3">Load</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {rows.length === 0 ? (
                <tr className="bg-slate-900">
                  <td className="px-4 py-4 text-slate-400" colSpan={3}>
                    No events yet. Install snippet on your website and run a scan.
                  </td>
                </tr>
              ) : (
                rows.map((event, idx) => (
                  <tr key={`${event.url ?? "event"}-${idx}`} className="bg-slate-900">
                    <td className="px-4 py-3 text-slate-200">{event.url ?? "—"}</td>
                    <td className="px-4 py-3">{formatNumber((event.vitals?.domContentLoaded ?? 0) / 1000, "s")}</td>
                    <td className="px-4 py-3">{formatNumber((event.vitals?.load ?? 0) / 1000, "s")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
