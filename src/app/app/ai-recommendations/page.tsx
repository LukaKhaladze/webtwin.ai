"use client";

import { useMemo, useState } from "react";

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

const impactStyles: Record<Recommendation["impact"], string> = {
  good: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  improve: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  bad: "bg-rose-500/15 text-rose-200 border-rose-500/30",
};

const impactLabel: Record<Recommendation["impact"], string> = {
  good: "Good",
  improve: "Improve",
  bad: "Bad",
};

export default function AiRecommendationsPage() {
  const [url, setUrl] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "good" | "bad" | "improve">("all");
  const [activeCategory, setActiveCategory] = useState<"all" | "uiux" | "seo">("uiux");
  const [score, setScore] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [device, setDevice] = useState<"phone" | "desktop">("phone");
  const snapshotKey = device === "phone" ? "mobile" : "desktop";
  const [scanVersion, setScanVersion] = useState(0);
  const pins = useMemo(() => {
    if (!scan) return [];
    const positions = [
      { x: 18, y: 22 },
      { x: 62, y: 28 },
      { x: 42, y: 46 },
      { x: 25, y: 64 },
      { x: 72, y: 62 },
      { x: 35, y: 78 },
    ];
    return scan.recommendations
      .filter((rec) => rec.impact !== "good")
      .slice(0, positions.length)
      .map((rec, index) => ({ ...rec, ...positions[index] }));
  }, [scan]);

  const filtered = useMemo(() => {
    if (!scan) return [];
    const byCategory =
      activeCategory === "all" ? scan.recommendations : scan.recommendations.filter((rec) => rec.category === activeCategory);
    if (activeFilter === "all") return byCategory;
    return byCategory.filter((rec) => rec.impact === activeFilter);
  }, [activeFilter, activeCategory, scan]);

  const handleScan = async () => {
    const target = url.trim() || scan?.targetUrl || "";
    if (!target) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-recommendations/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
      });
      const json = (await res.json()) as ScanResult & { error?: string };
      if (!res.ok) {
        setError(json.error || "Scan failed.");
        return;
      }
      setScan(json);
      setScore(json.score);
      setLastUpdated(new Date().toLocaleTimeString());
      setScanVersion((prev) => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const setDeviceOnly = (next: "phone" | "desktop") => {
    setDevice(next);
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">AI Recommendations</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Scan a page and get UI/UX feedback</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Paste a URL to generate a full-page snapshot plus UI/UX and SEO recommendations for mobile and desktop layouts.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white placeholder:text-slate-500"
            placeholder="https://yourdomain.com/product/..."
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
          <button
            type="button"
            className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-emerald-400"
            onClick={handleScan}
          >
            {loading ? "Scanning..." : "Scan Page"}
          </button>
          {lastUpdated && <span className="text-xs text-slate-400">Last update: {lastUpdated}</span>}
        </div>
        {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.35fr_1.65fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Score</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-white">{score || "--"}</span>
                <span className="text-sm text-slate-400">/ 100</span>
              </div>
            </div>
            <button className="h-fit rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white" type="button">
              Talk to expert
            </button>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-slate-800">
            <div className="h-2 rounded-full bg-amber-400" style={{ width: `${Math.min(100, score || 0)}%` }} />
          </div>
          <p className="mt-4 text-xs text-slate-300">
            {scan?.summary || "Scan a page to generate a structured executive summary of the UI and UX findings."}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap items-center gap-2">
            {["all", "good", "bad", "improve"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveFilter(tab as typeof activeFilter)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  activeFilter === tab ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {tab === "all" ? "All" : impactLabel[tab as keyof typeof impactLabel]}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
            {["uiux", "seo", "all"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat as typeof activeCategory)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                  activeCategory === cat ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {cat === "all" ? "All" : cat.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950 p-4 text-xs text-slate-400">
                No recommendations for this filter yet. Try "All" or switch UI/UX vs SEO.
              </div>
            ) : (
              filtered.map((rec) => (
                <div key={rec.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{rec.title}</p>
                    <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase ${impactStyles[rec.impact]}`}>
                      {impactLabel[rec.impact]}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">{rec.detail}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
            <span>Snapshot</span>
            <div className="flex items-center gap-2">
              <button
                className={`rounded-full border px-2 py-1 ${device === "desktop" ? "border-emerald-400 text-emerald-300" : "border-slate-700 text-slate-300"}`}
                type="button"
                onClick={() => setDeviceOnly("desktop")}
              >
                Desktop
              </button>
              <button
                className={`rounded-full border px-2 py-1 ${device === "phone" ? "border-emerald-400 text-emerald-300" : "border-slate-700 text-slate-300"}`}
                type="button"
                onClick={() => setDeviceOnly("phone")}
              >
                Mobile
              </button>
              <button
                className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300"
                type="button"
                onClick={handleScan}
              >
                Refresh
              </button>
            </div>
          </div>
          <div className="mt-4 rounded-3xl border border-slate-800 bg-slate-950 p-4">
            {scan?.snapshots[snapshotKey] ? (
              <div className="relative max-h-[700px] w-full overflow-auto rounded-2xl border border-slate-800 bg-slate-950">
                <img
                  src={`${scan.snapshots[snapshotKey] ?? ""}${(scan.snapshots[snapshotKey] || "").includes("?") ? "&" : "?"}v=${scanVersion}-${device}`}
                  alt={`${device} snapshot`}
                  className="w-full object-contain"
                />
                {pins.map((pin) => (
                  <div
                    key={pin.id}
                    className="group absolute"
                    style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-900 bg-rose-500 text-xs font-semibold text-white shadow-lg">
                      !
                    </div>
                    <div className="pointer-events-none absolute left-10 top-1/2 z-10 w-56 -translate-y-1/2 rounded-2xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200 opacity-0 shadow-xl transition group-hover:opacity-100">
                      <p className="text-sm font-semibold text-white">{pin.title}</p>
                      <p className="mt-1 text-slate-400">{pin.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="aspect-[16/9] w-full rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-4">
                <div className="h-full w-full rounded-xl border border-slate-800 bg-[radial-gradient(circle_at_top,#1f2937,transparent_70%)]" />
                <p className="mt-3 text-xs text-slate-400">Snapshot unavailable. Ensure `SCREENSHOTONE_ACCESS_KEY` is set.</p>
              </div>
            )}
          </div>
        </div>

      </section>
    </div>
  );
}
