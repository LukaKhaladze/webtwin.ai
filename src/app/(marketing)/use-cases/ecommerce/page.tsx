export default function Page() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="flex flex-col gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">WebTwin AI</p>
          <h1 className="text-4xl font-semibold">E-commerce</h1>
          <p className="max-w-2xl text-lg text-slate-600">Predict conversion impact across product, cart, and checkout flows.</p>
        </header>
        <section className="rounded-3xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold">What you&apos;ll find here</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>Identify drop-offs by step.</li>
            <li>Simulate checkout changes.</li>
            <li>Protect revenue during peak traffic.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
