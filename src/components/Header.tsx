import { useState } from "react";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <a href="/" className="flex items-center gap-1.5 text-xl font-bold tracking-tight">
          Trade
          <span className="text-brand">Launch</span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex">
          <a href="/#how-it-works" className="transition-colors hover:text-charcoal">
            How It Works
          </a>
          <a href="/#trades" className="transition-colors hover:text-charcoal">
            Trades
          </a>
          <a href="/pricing" className="transition-colors hover:text-charcoal">
            Pricing
          </a>
          <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 p-0.5 text-xs">
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">Apprentices</span>
            <span className="px-3 py-1 text-gray-500">For Contractors</span>
          </span>
        </nav>

        {/* Desktop CTA */}
        <a
          href="/post-job"
          className="hidden rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-hover md:inline-flex"
        >
          Get Started
        </a>

        {/* Mobile hamburger */}
        <button
          className="inline-flex items-center justify-center rounded-lg p-2 text-gray-600 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <svg className="size-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-4 pb-6 pt-4 md:hidden">
          <nav className="flex flex-col gap-4 text-sm font-medium text-gray-600">
            <a href="/#how-it-works" onClick={() => setMobileOpen(false)} className="hover:text-charcoal">
              How It Works
            </a>
            <a href="/#trades" onClick={() => setMobileOpen(false)} className="hover:text-charcoal">
              Trades
            </a>
            <a href="/pricing" onClick={() => setMobileOpen(false)} className="hover:text-charcoal">
              Pricing
            </a>
            <div className="flex gap-2 pt-2">
              <span className="rounded-full border border-brand/30 bg-brand-light px-4 py-1.5 text-xs font-semibold text-brand">
                Apprentices
              </span>
              <span className="rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-xs text-gray-500">
                For Contractors
              </span>
            </div>
            <a
              href="/post-job"
              className="mt-2 inline-flex justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
            >
              Get Started
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
