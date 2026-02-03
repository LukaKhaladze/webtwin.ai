const nodes = [
  { name: "Home", status: "healthy" },
  { name: "Collection", status: "warning" },
  { name: "Product", status: "healthy" },
  { name: "Cart", status: "critical" },
  { name: "Checkout", status: "warning" },
  { name: "Order confirmation", status: "healthy" },
];

const statuses: Record<string, string> = {
  healthy: "bg-emerald-500/20 text-emerald-200",
  warning: "bg-amber-500/20 text-amber-200",
  critical: "bg-rose-500/20 text-rose-200",
};

export default function TwinMapPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Twin Map</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Flow and friction map</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Visualize page relationships, drop-offs, and performance bottlenecks.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-white">Navigation graph</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {nodes.map((node) => (
              <div
                key={node.name}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white">{node.name}</p>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${statuses[node.status]}`}>
                    {node.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400">Top exits: {node.name} → {node.status === "critical" ? "Exit" : "Next step"}</p>
              </div>
            ))}
          </div>
        </div>
        <aside className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-white">Selected node</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <p className="font-semibold text-white">Cart</p>
              <p className="mt-1 text-xs text-slate-400">Drop-off intensity: High</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Performance</p>
              <p className="mt-2 text-sm text-slate-200">LCP 3.1s · CLS 0.19</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Friction notes</p>
              <p className="mt-2 text-sm text-slate-200">Promo code entry causing layout shift.</p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
