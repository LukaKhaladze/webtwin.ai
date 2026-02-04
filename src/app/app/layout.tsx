import Link from "next/link";

const navItems = [
  { href: "/app/overview", label: "Overview" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-8 md:flex-row">
        <aside className="w-full md:w-60">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              WebTwin AI
            </p>
            <h2 className="mt-3 text-lg font-semibold">Dashboard</h2>
            <nav className="mt-6 flex flex-col gap-2 text-sm text-slate-300">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  className="rounded-xl px-3 py-2 hover:bg-slate-800 hover:text-white"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-6">
              <Link
                className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900"
                href="/app/onboarding"
              >
                New Twin Setup
              </Link>
            </div>
          </div>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
