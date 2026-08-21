import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { SchoolBadge } from "~/components/SchoolBadge";

type SchoolInfo = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  trades: string | null;
  city: string | null;
  state: string | null;
  website: string | null;
  logo_url: string | null;
};

type Load =
  | { status: "loading" }
  | { status: "available"; school: SchoolInfo }
  | { status: "unavailable" };

function PublicProfilePage() {
  const { slug } = Route.useParams();
  const [load, setLoad] = useState<Load>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/school-public", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        });
        if (cancelled) return;
        if (res.ok) {
          const school = (await res.json()) as SchoolInfo;
          setLoad({ status: "available", school });
        } else {
          setLoad({ status: "unavailable" });
        }
      } catch {
        if (!cancelled) setLoad({ status: "unavailable" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        {load.status === "loading" && (
          <div className="flex items-center justify-center py-24 text-gray-500">
            <span className="text-sm">Loading program…</span>
          </div>
        )}

        {load.status === "unavailable" && (
          <div className="rounded-2xl border border-gray-200/70 bg-white p-8 text-center shadow-sm sm:p-12">
            <h1 className="text-2xl font-bold tracking-tight text-charcoal">
              This program isn't available
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-gray-600">
              We couldn't find an approved TradeLaunch School Partner at this
              address. The program may not exist yet, or it may not be approved.
            </p>
            <Link
              to="/schools"
              className="mt-6 inline-block rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover cursor-pointer"
            >
              Learn about partnering with TradeLaunch
            </Link>
          </div>
        )}

        {load.status === "available" && <ProfileView school={load.school} />}
      </main>
      <Footer />
    </>
  );
}

function tradesList(trades: string | null): string[] {
  if (!trades) return [];
  return trades
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function ProfileView({ school }: { school: SchoolInfo }) {
  const trades = tradesList(school.trades);
  const location = [school.city, school.state].filter(Boolean).join(", ");

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-warm-gray px-6 py-10 sm:px-10">
        <SchoolBadge size="sm" />
        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
          {school.logo_url ? (
            <img
              src={school.logo_url}
              alt={`${school.name} logo`}
              className="size-20 shrink-0 rounded-xl border border-gray-200 bg-white object-contain p-1"
              loading="lazy"
            />
          ) : (
            <div className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-brand font-bold text-white">
              {school.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight text-charcoal">
              {school.name}
            </h1>
            {location && (
              <p className="mt-1 text-sm text-gray-600">{location}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-8 px-6 py-8 sm:px-10 sm:py-10">
        {school.description ? (
          <section>
            <h2 className="text-lg font-semibold text-charcoal">About</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-700">
              {school.description}
            </p>
          </section>
        ) : null}

        {trades.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-charcoal">Trades offered</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {trades.map((t) => (
                <span
                  key={t}
                  className="inline-block rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700"
                >
                  {t}
                </span>
              ))}
            </div>
          </section>
        )}

        <section className="flex flex-wrap items-center gap-4 border-t border-gray-100 pt-6">
          <a
            href="/schools"
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-hover"
          >
            ← School Partners
          </a>
          {school.website && (
            <a
              href={normalizeUrl(school.website)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover"
            >
              Visit website
            </a>
          )}
        </section>
      </div>
    </div>
  );
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export const Route = createFileRoute("/schools/$slug")({
  component: PublicProfilePage,
});
