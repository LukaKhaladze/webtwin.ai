export default function Page() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="flex flex-col gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">WebTwin AI</p>
          <h1 className="text-4xl font-semibold">Login</h1>
          <p className="max-w-2xl text-lg text-slate-600">Access your WebTwin AI dashboard and simulations.</p>
        </header>
        <section className="rounded-3xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold">What you&apos;ll find here</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>Secure authentication.</li>
            <li>Team-based access.</li>
            <li>Password recovery.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
