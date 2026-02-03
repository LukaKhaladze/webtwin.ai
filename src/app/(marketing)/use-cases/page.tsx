export default function Page() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="flex flex-col gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">WebTwin AI</p>
          <h1 className="text-4xl font-semibold">Use Cases</h1>
          <p className="max-w-2xl text-lg text-slate-600">How different teams use WebTwin AI to reduce risk and grow conversions.</p>
        </header>
        <section className="rounded-3xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold">What you&apos;ll find here</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>E-commerce optimization.</li>
            <li>Marketing experimentation.</li>
            <li>Engineering performance assurance.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
