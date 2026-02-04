"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const STEP_LABELS = [
  "Website",
  "Setup method",
  "Integrations",
  "Build twin",
] as const;

type SetupMethod = "snippet" | "dns";

export default function Page() {
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [setupMethod, setSetupMethod] = useState<SetupMethod>("snippet");
  const [analyticsConnected, setAnalyticsConnected] = useState(false);
  const [buildStatus, setBuildStatus] = useState<"idle" | "building" | "ready">("idle");
  const initialAppDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "https://YOUR_APP_DOMAIN";
  const [appDomain, setAppDomain] = useState(initialAppDomain);

  const dnsToken = useMemo(() => {
    if (!domain) return "tw-verify-xxxxxxxx";
    const sanitized = domain.replace(/\\s+/g, "").toLowerCase();
    return `tw-verify-${sanitized.replace(/[^a-z0-9-]/g, "").slice(0, 16) || "token"}`;
  }, [domain]);

  useEffect(() => {
    setAppDomain(window.location.origin);
  }, []);

  const snippet = `<script async src="${appDomain}/rum.js" data-site="${domain || "yourdomain.com"}" data-endpoint="${appDomain}/api/rum"></script>`;

  const canBuild = domain.length > 3 && buildStatus !== "building";

  const handleStartBuild = () => {
    if (!canBuild) return;
    setBuildStatus("building");
    const cleanDomain = domain.trim().toLowerCase();
    if (cleanDomain) {
      localStorage.setItem("webtwin.activeSite", cleanDomain);
    }
    setBuildStatus("ready");
    router.push(`/app/overview?site=${encodeURIComponent(cleanDomain || "yourdomain.com")}`);
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Onboarding</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Connect your site</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Complete these steps to start building your Digital Twin and unlock simulations.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="flex flex-col gap-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Step 1</p>
            <h2 className="mt-2 text-lg font-semibold text-white">Enter website domain</h2>
            <p className="mt-2 text-sm text-slate-400">
              We&apos;ll use this to map your site structure and associate collected RUM events.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Domain
              </label>
              <input
                className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600"
                placeholder="example.com"
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Step 2</p>
            <h2 className="mt-2 text-lg font-semibold text-white">Choose setup method</h2>
            <p className="mt-2 text-sm text-slate-400">
              Install the lightweight RUM snippet for fastest onboarding or verify via DNS. Replace
              YOUR_APP_DOMAIN with your hosted WebTwin AI domain.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {(["snippet", "dns"] as SetupMethod[]).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setSetupMethod(method)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    setupMethod === method
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-200"
                      : "border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <p className="font-semibold">
                    {method === "snippet" ? "JS snippet" : "DNS verification"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {method === "snippet"
                      ? "Paste in your site header for instant data capture."
                      : "Add a TXT record if code access is limited."}
                  </p>
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-4">
              {setupMethod === "snippet" ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Snippet
                  </p>
                  <pre className="mt-3 whitespace-pre-wrap text-xs text-slate-200">
                    {snippet}
                  </pre>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    DNS TXT record
                  </p>
                  <div className="mt-3 text-sm text-slate-200">
                    <p>Host: {domain || "yourdomain.com"}</p>
                    <p>Value: {dnsToken}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Step 3</p>
            <h2 className="mt-2 text-lg font-semibold text-white">Connect analytics (optional)</h2>
            <p className="mt-2 text-sm text-slate-400">
              Import existing metrics from Google Analytics or other sources.
            </p>
            <label className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={analyticsConnected}
                onChange={(event) => setAnalyticsConnected(event.target.checked)}
              />
              Connect Google Analytics
            </label>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Step 4</p>
            <h2 className="mt-2 text-lg font-semibold text-white">Start your first twin build</h2>
            <p className="mt-2 text-sm text-slate-400">
              We&apos;ll crawl structure, observe user flows, and compute performance baselines.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleStartBuild}
                disabled={!canBuild}
                className={`rounded-full px-5 py-2 text-xs font-semibold transition ${
                  canBuild
                    ? "bg-emerald-500 text-slate-900 hover:bg-emerald-400"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                {buildStatus === "building" ? "Building…" : "Start build"}
              </button>
              <p className="text-xs text-slate-400">
                {buildStatus === "idle" && "Average build time: ~2 minutes."}
                {buildStatus === "building" && "Live data will begin streaming shortly."}
                {buildStatus === "ready" && "Twin is ready! Visit Overview for insights."}
              </p>
            </div>
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Progress</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              {STEP_LABELS.map((label, index) => {
                const stepNumber = index + 1;
                const isComplete =
                  (stepNumber === 1 && domain.length > 3) ||
                  (stepNumber === 2 && setupMethod) ||
                  (stepNumber === 3 && analyticsConnected) ||
                  (stepNumber === 4 && buildStatus === "ready");
                return (
                  <li key={label} className="flex items-center justify-between gap-3">
                    <span>{label}</span>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${
                        isComplete ? "bg-emerald-500/20 text-emerald-200" : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {isComplete ? "Done" : "Pending"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Need help?</p>
            <p className="mt-3 text-sm text-slate-400">
              Docs include setup guides, snippet validation, and DNS verification steps.
            </p>
            <button
              type="button"
              className="mt-4 rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200"
            >
              Open docs
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
