import Link from "next/link";

const navLinks = [
  { href: "/product", label: "Product" },
  { href: "/use-cases", label: "Use cases" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
  { href: "/security", label: "Security" },
];

const companyLinks = [
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link className="text-lg font-semibold" href="/">
            WebTwin AI
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            {navLinks.map((item) => (
              <Link key={item.href} className="hover:text-slate-900" href={item.href}>
                {item.label}
              </Link>
            ))}
            <Link className="hover:text-slate-900" href="/login">
              Login
            </Link>
            <Link
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
              href="/signup"
            >
              Start your Twin
            </Link>
          </nav>
          <div className="flex items-center gap-3 md:hidden">
            <Link className="text-sm text-slate-600" href="/login">
              Login
            </Link>
            <Link
              className="rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
              href="/signup"
            >
              Start
            </Link>
          </div>
        </div>
      </header>

      {children}

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-4">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              WebTwin AI
            </p>
            <p className="text-sm text-slate-600">
              Digital Twin simulations for structure, behavior, and performance.
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-slate-900">Product</p>
            {navLinks.map((item) => (
              <Link key={item.href} className="block text-slate-600 hover:text-slate-900" href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-slate-900">Company</p>
            {companyLinks.map((item) => (
              <Link key={item.href} className="block text-slate-600 hover:text-slate-900" href={item.href}>
                {item.label}
              </Link>
            ))}
            <Link className="block text-slate-600 hover:text-slate-900" href="/terms">
              Terms
            </Link>
            <Link className="block text-slate-600 hover:text-slate-900" href="/privacy">
              Privacy
            </Link>
          </div>
          <div className="space-y-3">
            <p className="font-semibold text-slate-900">Get started</p>
            <p className="text-sm text-slate-600">
              Build your first twin in minutes.
            </p>
            <Link
              className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
              href="/signup"
            >
              Start your Twin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
