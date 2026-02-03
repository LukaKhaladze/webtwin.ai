const insights = [
  {
    title: "High friction at checkout step 2",
    impact: "+11% drop-off",
    action: "Simplify shipping options",
  },
  {
    title: "Mobile users drop 18% more on product page",
    impact: "-0.6% conversion",
    action: "Reduce image payload",
  },
  {
    title: "Script Tag Manager blocking rendering",
    impact: "+0.4s LCP",
    action: "Defer non-critical scripts",
  },
];

export default function InsightsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Insights</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">AI-generated findings</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Prioritized recommendations based on structure, behavior, and performance data.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        {insights.map((insight) => (
          <div key={insight.title} className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">{insight.title}</p>
              <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-[10px] font-semibold text-emerald-200">
                {insight.impact}
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-400">Suggested fix: {insight.action}</p>
            <button
              type="button"
              className="mt-4 rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200"
            >
              Simulate this change
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
