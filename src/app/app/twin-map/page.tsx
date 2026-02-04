"use client";

import { useEffect, useMemo, useState } from "react";

type TwinMapNode = {
  key: string;
  hits: number;
  avgLoadMs: number;
  avgDclMs: number;
  status: "healthy" | "warning" | "critical";
};

type TwinMapEdge = {
  from: string;
  to: string;
  count: number;
};

type TwinMapResponse = {
  nodes: TwinMapNode[];
  edges: TwinMapEdge[];
  totals: {
    events: number;
    pages: number;
  };
};

const statusClasses: Record<TwinMapNode["status"], string> = {
  healthy: "bg-emerald-500/20 text-emerald-200",
  warning: "bg-amber-500/20 text-amber-200",
  critical: "bg-rose-500/20 text-rose-200",
};

export default function TwinMapPage() {
  const [site, setSite] = useState("");
  const [data, setData] = useState<TwinMapResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("site")?.trim() || "";
    const saved = (localStorage.getItem("webtwin.activeSite") || "").trim();
    const target = (fromUrl || saved || "").toLowerCase();
    if (!target) return;

    setSite(target);
    setLoading(true);
    fetch(`/api/twin-map?site=${encodeURIComponent(target)}`)
      .then((res) => res.json())
      .then((json) => setData(json as TwinMapResponse))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!data?.nodes.length) {
      setSelectedKey(null);
      return;
    }
    if (!selectedKey || !data.nodes.find((n) => n.key === selectedKey)) {
      setSelectedKey(data.nodes[0].key);
    }
  }, [data, selectedKey]);

  const selectedNode = useMemo(() => data?.nodes.find((n) => n.key === selectedKey) || null, [data, selectedKey]);
  const selectedEdges = useMemo(
    () => (data?.edges || []).filter((e) => e.from === selectedKey || e.to === selectedKey).slice(0, 6),
    [data, selectedKey]
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Twin Map</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Flow and friction map</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">Real page-flow data from captured RUM events.</p>
        <p className="mt-2 text-xs text-slate-400">
          Site: <span className="text-slate-200">{site || "--"}</span> · Events:{" "}
          <span className="text-slate-200">{data?.totals.events ?? 0}</span>
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-white">Pages</h2>
          {loading ? (
            <p className="mt-4 text-sm text-slate-400">Loading map...</p>
          ) : (data?.nodes.length || 0) === 0 ? (
            <p className="mt-4 text-sm text-slate-400">No real flow data yet for this site.</p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {data?.nodes.map((node) => (
                <button
                  key={node.key}
                  className={`rounded-2xl border p-4 text-left ${
                    selectedKey === node.key ? "border-emerald-500 bg-slate-950" : "border-slate-800 bg-slate-950"
                  }`}
                  onClick={() => setSelectedKey(node.key)}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold text-white">{node.key}</p>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${statusClasses[node.status]}`}>{node.status}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    {node.hits} hits · DCL {(node.avgDclMs / 1000).toFixed(1)}s · Load {(node.avgLoadMs / 1000).toFixed(1)}s
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-white">Selected node</h2>
          {!selectedNode ? (
            <p className="mt-4 text-sm text-slate-400">Choose a page node to inspect details.</p>
          ) : (
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="font-semibold text-white">{selectedNode.key}</p>
                <p className="mt-1 text-xs text-slate-400">{selectedNode.hits} visits</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Performance</p>
                <p className="mt-2 text-sm text-slate-200">
                  DCL {(selectedNode.avgDclMs / 1000).toFixed(1)}s · Load {(selectedNode.avgLoadMs / 1000).toFixed(1)}s
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Top transitions</p>
                <ul className="mt-2 space-y-2 text-xs text-slate-300">
                  {selectedEdges.length === 0 && <li>No transition data yet.</li>}
                  {selectedEdges.map((edge, idx) => (
                    <li key={`${edge.from}-${edge.to}-${idx}`} className="break-words">
                      {edge.from} → {edge.to} ({edge.count})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

