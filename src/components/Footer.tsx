export function Footer() {
  return (
    <footer className="w-full border-t border-gray-200/70 bg-charcoal text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        {/* Mobile: stacked layout; sm+: side-by-side */}
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          {/* Links — wrap nicely on narrow screens */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <a href="#" className="transition-colors hover:text-white">
              For Contractors
            </a>
            <a href="/post-job" className="transition-colors hover:text-white">
              Post a Job
            </a>
            <a href="/apply" className="transition-colors hover:text-white">
              Browse Jobs
            </a>
            <a href="/terms" className="transition-colors hover:text-white">
              Terms of Service
            </a>
            <a href="/privacy" className="transition-colors hover:text-white">
              Privacy Policy
            </a>
            <a href="/background-check-consent" className="transition-colors hover:text-white">
              Background Check Consent
            </a>
            <a href="/contact" className="transition-colors hover:text-white">
              Contact
            </a>
          </div>

          {/* Copyright */}
          <p className="text-sm text-gray-500">© 2026 TradeLaunch</p>
        </div>
      </div>
    </footer>
  );
}
