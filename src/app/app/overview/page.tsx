import { getSupabaseServerClient } from "@/lib/supabase/server";

export const revalidate = 30;

function formatNumber(value: number, suffix = "") {
  if (Number.isNaN(value)) return "-";
  return `${value.toFixed(1)}${suffix}`;
}

export default async function OverviewPage() {
  const supabase = getSupabaseServerClient();

  const { data: events } = await supabase
    .from("rum_events")
    .select("url, vitals, ts")
    .order("ts", { ascending: false })
    .limit(200);

  const totalEvents = events?.length ?? 0;
  const uniquePages = new Set(events?.map((event) => event.url).filter(Boolean)).size;
  const domContentLoadedAvg =
    events && events.length
      ? events.reduce((acc, event) => acc + ((event.vitals as any)?.domContentLoaded ?? 0), 0) / events.length
      : 0;
  const loadAvg =
    events && events.length
      ? events.reduce((acc, event) => acc + ((event.vitals as any)?.load ?? 0), 0) / events.length
      : 0;

  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Overview</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Twin health snapshot</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Real-time metrics from RUM events (last 200 hits).
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Pageviews</p>
          <div className="mt-3 text-2xl font-semibold text-white">{totalEvents}</div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Unique pages</p>
          <div className="mt-3 text-2xl font-semibold text-white">{uniquePages}</div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">DCL (avg)</p>
          <div className="mt-3 text-2xl font-semibold text-white">{formatNumber(domContentLoadedAvg / 1000, "s")}</div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Load (avg)</p>
          <div className="mt-3 text-2xl font-semibold text-white">{formatNumber(loadAvg / 1000, "s")}</div>
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
              {(events ?? []).slice(0, 8).map((event, idx) => (
                <tr key={`${event.url}-${idx}`} className="bg-slate-900">
                  <td className="px-4 py-3 text-slate-200">{event.url}</td>
                  <td className="px-4 py-3">{formatNumber(((event.vitals as any)?.domContentLoaded ?? 0) / 1000, "s")}</td>
                  <td className="px-4 py-3">{formatNumber(((event.vitals as any)?.load ?? 0) / 1000, "s")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
