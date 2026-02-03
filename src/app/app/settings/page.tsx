const sections = [
  {
    title: "Websites",
    description: "Manage connected domains and verification status.",
  },
  {
    title: "Team members",
    description: "Invite teammates and assign roles.",
  },
  {
    title: "Integrations",
    description: "Analytics, tag managers, and data sources.",
  },
  {
    title: "Billing",
    description: "Plans, invoices, and payment methods.",
  },
];

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Settings</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Workspace configuration</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Control access, integrations, and billing for your WebTwin AI workspace.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <div key={section.title} className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm font-semibold text-white">{section.title}</p>
            <p className="mt-2 text-sm text-slate-400">{section.description}</p>
            <button
              type="button"
              className="mt-4 rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200"
            >
              Manage
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
