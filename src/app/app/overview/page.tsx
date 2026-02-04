"use client";

import { useEffect, useMemo, useState } from "react";

type OverviewTotals = {
  pageviews: number;
  uniquePages: number;
  domContentLoadedAvg: number;
  loadAvg: number;
};

type OverviewEvent = {
  site?: string | null;
  url: string | null;
  vitals: { domContentLoaded?: number; load?: number } | null;
};

type OverviewResponse = {
  totals: OverviewTotals;
  events: OverviewEvent[];
};

type SiteHealthResponse = {
  lighthouse: {
    performance: number | null;
    seo: number | null;
    bestPractices: number | null;
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

function getBrowserTimings() {
  const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (navEntry) {
    return {
      domContentLoaded: Math.max(0, Math.round(navEntry.domContentLoadedEventEnd)),
      load: Math.max(0, Math.round(navEntry.loadEventEnd)),
    };
  }

  const timing = performance.timing;
  if (!timing || !timing.navigationStart) {
    return { domContentLoaded: 0, load: 0 };
  }

  return {
    domContentLoaded: Math.max(0, timing.domContentLoadedEventEnd - timing.navigationStart),
    load: Math.max(0, timing.loadEventEnd - timing.navigationStart),
  };
}

export default function OverviewPage() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [sending, setSending] = useState(false);
  const [lastStatus, setLastStatus] = useState<"idle" | "sent" | "error">("idle");
  const [siteFilter, setSiteFilter] = useState("");
  const [siteHealth, setSiteHealth] = useState<SiteHealthResponse | null>(null);

  const fetchOverview = (site = siteFilter) => {
    const query = site ? `?site=${encodeURIComponent(site)}` : "";
    return fetch(`/api/overview${query}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json as OverviewResponse);
      });
  };

  const fetchSiteHealth = (site = siteFilter) => {
    const query = site ? `?site=${encodeURIComponent(site)}` : "";
    return fetch(`/api/site-health${query}`)
      .then((res) => res.json())
      .then((json) => {
        setSiteHealth(json as SiteHealthResponse);
      });
  };

  useEffect(() => {
    const siteFromQuery = new URLSearchParams(window.location.search).get("site")?.trim() || "";
    if (siteFromQuery) {
      setSiteFilter(siteFromQuery);
      localStorage.setItem("webtwin.activeSite", siteFromQuery);
      return;
    }

    const savedSite = (localStorage.getItem("webtwin.activeSite") || "").trim();
    if (savedSite) {
      setSiteFilter(savedSite);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchOverview(siteFilter)
      .then(() => fetchSiteHealth(siteFilter))
      .catch(() => {
        if (active)
          setData({
            totals: { pageviews: 0, uniquePages: 0, domContentLoadedAvg: 0, loadAvg: 0 },
            events: [],
          });
      });

    return () => {
      active = false;
    };
  }, [siteFilter]);

  const rows = useMemo(() => data?.events ?? [], [data]);

  const handleSendTest = async () => {
    try {
      setSending(true);
      setLastStatus("idle");
      const vitals = getBrowserTimings();
      const res = await fetch("/api/rum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "pageview",
          site: siteFilter || window.location.hostname,
          url: window.location.href,
          referrer: document.referrer || null,
          userAgent: navigator.userAgent,
          viewport: { width: window.innerWidth, height: window.innerHeight },
          vitals,
          ts: Date.now(),
        }),
      });
      if (!res.ok) throw new Error("send_failed");
      await fetchOverview(siteFilter);
      await fetchSiteHealth(siteFilter);
      setLastStatus("sent");
    } catch (err) {
      setLastStatus("error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Overview</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Twin health snapshot</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <span>Live metrics from RUM events (last 200 hits).</span>
          {siteFilter && <span className="text-xs text-slate-400">Site: {siteFilter}</span>}
          <button
            type="button"
            onClick={handleSendTest}
            disabled={sending}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              sending ? "bg-slate-800 text-slate-500" : "bg-emerald-500 text-slate-900 hover:bg-emerald-400"
            }`}
          >
            {sending ? "Sending..." : "Send real test event"}
          </button>
          {lastStatus === "sent" && <span className="text-xs text-emerald-300">Event sent.</span>}
          {lastStatus === "error" && <span className="text-xs text-rose-300">Send failed.</span>}
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Performance</p>
          <div className="mt-3 text-2xl font-semibold text-white">
            {formatScore(siteHealth?.lighthouse.performance ?? null)}
          </div>
          <p className="mt-2 text-xs text-slate-400">Lighthouse mobile score</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">SEO</p>
          <div className="mt-3 text-2xl font-semibold text-white">
            {formatScore(siteHealth?.lighthouse.seo ?? null)}
          </div>
          <p className="mt-2 text-xs text-slate-400">Lighthouse mobile score</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Best practices</p>
          <div className="mt-3 text-2xl font-semibold text-white">
            {formatScore(siteHealth?.lighthouse.bestPractices ?? null)}
          </div>
          <p className="mt-2 text-xs text-slate-400">Lighthouse mobile score</p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Uptime</p>
          <div className="mt-3 text-2xl font-semibold text-white">
            {siteHealth?.uptime.isUp === null ? "--" : siteHealth?.uptime.isUp ? "UP" : "DOWN"}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {siteHealth?.uptime.responseMs
              ? `${siteHealth.uptime.responseMs}ms • HTTP ${siteHealth.uptime.statusCode ?? "-"}`
              : "Live check"}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Downtime history: coming next</p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold text-white">Latest events</h2>
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
                    No events yet. Add the snippet to start collecting data.
                  </td>
                </tr>
              ) : (
                rows.map((event, idx) => (
                  <tr key={`${event.url ?? "event"}-${idx}`} className="bg-slate-900">
                    <td className="px-4 py-3 text-slate-200">{event.url ?? "—"}</td>
                    <td className="px-4 py-3">
                      {formatNumber(((event.vitals as any)?.domContentLoaded ?? 0) / 1000, "s")}
                    </td>
                    <td className="px-4 py-3">
                      {formatNumber(((event.vitals as any)?.load ?? 0) / 1000, "s")}
                    </td>
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
