import { useState, useEffect } from "react";
import { supabase } from "~/lib/supabase";

function getAudienceFromPath(pathname: string): "apprentices" | "contractors" {
  if (pathname === "/post-job") return "contractors";
  if (pathname === "/apply") return "apprentices";
  return "apprentices"; // default
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [audience, setAudience] = useState<"apprentices" | "contractors">(() => {
    if (typeof window !== "undefined") {
      return getAudienceFromPath(window.location.pathname);
    }
    return "apprentices";
  });

  // Sync audience state when URL changes (e.g. browser back/forward)
  useEffect(() => {
    const onPopState = () => {
      setAudience(getAudienceFromPath(window.location.pathname));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    // Check auth on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session);
    });

    // Listen for auth changes
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  async function handleLogout(e: React.MouseEvent) {
    e.preventDefault();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  function handleToggleAudience(newAudience: "apprentices" | "contractors") {
    setAudience(newAudience);
  }

  const getStartedHref = audience === "apprentices" ? "/apply" : "/login";

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
          <a href="/schools" className="transition-colors hover:text-charcoal">
            For Schools
          </a>
          <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 p-0.5 text-xs">
            <a
              href="/apply"
              onClick={() => handleToggleAudience("apprentices")}
              className={`cursor-pointer rounded-full px-3 py-1 transition-colors ${
                audience === "apprentices"
                  ? "bg-white shadow-sm text-charcoal font-semibold"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Apprentices
            </a>
            <a
              href="/post-job"
              onClick={() => handleToggleAudience("contractors")}
              className={`cursor-pointer rounded-full px-3 py-1 transition-colors ${
                audience === "contractors"
                  ? "bg-white shadow-sm text-charcoal font-semibold"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              For Contractors
            </a>
          </span>
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 md:flex">
          {loggedIn ? (
            <>
              <a
                href="/dashboard"
                className="text-sm font-medium text-gray-600 transition-colors hover:text-charcoal"
              >
                Dashboard
              </a>
              <a
                href="#"
                onClick={handleLogout}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
              >
                Logout
              </a>
            </>
          ) : (
            <>
              <a
                href="/login"
                className="text-sm font-medium text-gray-600 transition-colors hover:text-charcoal"
              >
                Login
              </a>
              <a
                href={getStartedHref}
                className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-hover"
              >
                Get Started
              </a>
            </>
          )}
        </div>

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
            <a href="/schools" onClick={() => setMobileOpen(false)} className="hover:text-charcoal">
              For Schools
            </a>
            <div className="flex gap-2 pt-2">
              <a
                href="/apply"
                onClick={() => {
                  handleToggleAudience("apprentices");
                  setMobileOpen(false);
                }}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  audience === "apprentices"
                    ? "border border-brand/30 bg-brand-light text-brand"
                    : "border border-gray-200 bg-gray-50 text-gray-500"
                }`}
              >
                Apprentices
              </a>
              <a
                href="/post-job"
                onClick={() => {
                  handleToggleAudience("contractors");
                  setMobileOpen(false);
                }}
                className={`rounded-full px-4 py-1.5 text-xs transition-colors ${
                  audience === "contractors"
                    ? "border border-brand/30 bg-brand-light text-brand font-semibold"
                    : "border border-gray-200 bg-gray-50 text-gray-500"
                }`}
              >
                For Contractors
              </a>
            </div>
            {loggedIn ? (
              <>
                <a
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="mt-2 inline-flex justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
                >
                  Dashboard
                </a>
                <a
                  href="#"
                  onClick={(e) => {
                    setMobileOpen(false);
                    handleLogout(e);
                  }}
                  className="inline-flex justify-center rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm"
                >
                  Logout
                </a>
              </>
            ) : (
              <>
                <a
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="mt-2 inline-flex justify-center rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm"
                >
                  Login
                </a>
                <a
                  href={getStartedHref}
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
                >
                  Get Started
                </a>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
