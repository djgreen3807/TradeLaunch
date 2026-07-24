import { Header } from "~/components/Header";

export function NotFound() {
  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-warm-cream">
        <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
          {/* Large 404 */}
          <p className="text-8xl font-extrabold tracking-tight text-brand sm:text-9xl">
            404
          </p>

          {/* Divider */}
          <div className="mx-auto mt-6 h-1 w-20 rounded-full bg-brand/30" />

          {/* Heading */}
          <h1 className="mt-8 text-3xl font-bold tracking-tight text-charcoal sm:text-4xl">
            Nothing here
          </h1>

          {/* Subtext */}
          <p className="mt-4 text-lg leading-relaxed text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </p>

          {/* CTA */}
          <a
            href="/"
            className="mt-10 inline-flex rounded-xl bg-brand px-8 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:bg-brand-hover hover:shadow-lg"
          >
            Go Home
          </a>
        </div>
      </main>
    </>
  );
}
