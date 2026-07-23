import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "~/styles/app.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "TradeLaunch — Apprenticeship Marketplace for Skilled Trades" },
      { name: "description", content: "Skip the $5K–$8K agency fees. TradeLaunch connects contractors directly with pre-vetted apprentices in electrical, plumbing, HVAC, welding, and more." },
      { property: "og:title", content: "TradeLaunch — Apprenticeship Marketplace for Skilled Trades" },
      { property: "og:description", content: "Skip the $5K–$8K agency fees. TradeLaunch connects contractors directly with pre-vetted apprentices in electrical, plumbing, HVAC, welding, and more." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://tradelaunch.com" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
    ],
  }),
  notFoundComponent: () => <div>Page not found</div>,
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
