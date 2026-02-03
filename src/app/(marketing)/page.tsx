import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-16">
        <section className="flex flex-col gap-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            WebTwin AI
          </p>
          <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
            Your Website&apos;s Digital Twin — powered by AI
          </h1>
          <p className="max-w-2xl text-lg text-slate-600 md:text-xl">
            Model real user behavior and performance. Run what-if simulations before shipping changes.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white"
              href="/signup"
            >
              Start your Twin
            </Link>
            <Link
              className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-800"
              href="/contact"
            >
              Book a Demo
            </Link>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Connect website",
              body: "Add a lightweight RUM snippet or verify via DNS to start modeling.",
            },
            {
              title: "Build the twin",
              body: "Unify site structure, user flows, and performance into one model.",
            },
            {
              title: "Simulate + optimize",
              body: "Forecast conversion, bounce, and infrastructure impact before deploys.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-3xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.body}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-slate-50 p-6">
            <h2 className="text-xl font-semibold">Key benefits</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>Predict conversion impact and drop-off risk.</li>
              <li>Detect UX friction with AI-generated insights.</li>
              <li>Track Core Web Vitals and regressions.</li>
              <li>Simulate traffic spikes and runtime risk.</li>
            </ul>
          </div>
          <div className="rounded-3xl bg-slate-900 p-6 text-white">
            <h2 className="text-xl font-semibold">Feature highlights</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-200">
              <li>Structural Twin</li>
              <li>Behavioral Twin</li>
              <li>Performance Twin</li>
              <li>What-if Simulator</li>
            </ul>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Ready to build your twin?</h2>
              <p className="text-sm text-slate-600">
                Start free, connect your site, and see the model in minutes.
              </p>
            </div>
            <Link
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white"
              href="/signup"
            >
              Start your Twin
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
