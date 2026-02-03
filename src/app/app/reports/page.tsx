const reports = [
  { title: "Weekly Twin Health", date: "Feb 2, 2026", status: "Ready" },
  { title: "Checkout Flow Review", date: "Jan 29, 2026", status: "Draft" },
  { title: "Performance Regression", date: "Jan 25, 2026", status: "Ready" },
];

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Reports</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Shareable insights</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Generate summaries for stakeholders and export decisions.
        </p>
      </header>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Create a new report</h2>
            <p className="text-sm text-slate-400">Compile the latest metrics and simulations.</p>
          </div>
          <button
            type="button"
            className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-900"
          >
            Generate report
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {reports.map((report) => (
          <div key={report.title} className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">{report.title}</p>
              <span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] font-semibold text-slate-300">
                {report.status}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">Generated {report.date}</p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200"
              >
                View report
              </button>
              <button
                type="button"
                className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200"
              >
                Share link
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
