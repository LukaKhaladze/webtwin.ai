const scenarios = [
  { title: "Speed improvement", description: "Reduce LCP by 1s across top 10 pages." },
  { title: "Checkout simplification", description: "Reduce checkout steps from 4 → 2." },
  { title: "Remove third-party script", description: "Replace marketing pixel with server-side event." },
  { title: "Traffic spike", description: "Simulate 5x traffic for a campaign launch." },
];

export default function SimulatorPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Simulator</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">What-if scenarios</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Model changes before deployment to predict conversion, bounce, and performance impact.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {scenarios.map((scenario) => (
          <div key={scenario.title} className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm font-semibold text-white">{scenario.title}</p>
            <p className="mt-2 text-sm text-slate-400">{scenario.description}</p>
            <button
              type="button"
              className="mt-4 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-900"
            >
              Run simulation
            </button>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold text-white">Latest results</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Conversion</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-300">+6.2%</p>
            <p className="mt-2 text-xs text-slate-400">Expected uplift on mobile checkout.</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Bounce rate</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-300">-4.1%</p>
            <p className="mt-2 text-xs text-slate-400">Improved above-the-fold speed.</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Infra risk</p>
            <p className="mt-2 text-2xl font-semibold text-amber-300">Medium</p>
            <p className="mt-2 text-xs text-slate-400">Scale cache layer for traffic spikes.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
