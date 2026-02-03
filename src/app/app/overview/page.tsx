"use client";

import { useEffect, useMemo, useState } from "react";

type OverviewTotals = {
  pageviews: number;
  uniquePages: number;
  domContentLoadedAvg: number;
  loadAvg: number;
};

type OverviewEvent = {
  url: string | null;
  vitals: { domContentLoaded?: number; load?: number } | null;
};

type OverviewResponse = {
  totals: OverviewTotals;
  events: OverviewEvent[];
};

function formatNumber(value: number, suffix = "") {
  if (!Number.isFinite(value)) return "-";
  return `${value.toFixed(1)}${suffix}`;
}

export default function OverviewPage() {
  const [data, setData] = useState<OverviewResponse | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/overview")
      .then((res) => res.json())
      .then((json) => {
        if (active) setData(json as OverviewResponse);
      })
      .catch(() => {
        if (active) setData({ totals: { pageviews: 0, uniquePages: 0, domContentLoadedAvg: 0, loadAvg: 0 }, events: [] });
      });

    return () => {
      active = false;
    };
  }, []);

  const totals = data?.totals ?? {
    pageviews: 0,
    uniquePages: 0,
    domContentLoadedAvg: 0,
    loadAvg: 0,
  };

  const rows = useMemo(() => data?.events ?? [], [data]);

  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Overview</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Twin health snapshot</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Live metrics from RUM events (last 200 hits).
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Pageviews</p>
          <div className="mt-3 text-2xl font-semibold text-white">{totals.pageviews}</div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Unique pages</p>
          <div className="mt-3 text-2xl font-semibold text-white">{totals.uniquePages}</div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">DCL (avg)</p>
          <div className="mt-3 text-2xl font-semibold text-white">
            {formatNumber(totals.domContentLoadedAvg / 1000, "s")}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Load (avg)</p>
          <div className="mt-3 text-2xl font-semibold text-white">
            {formatNumber(totals.loadAvg / 1000, "s")}
          </div>
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
