import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "~/styles/app.css?url";
import { NotFound } from "~/components/NotFound";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "TradeLaunch — Apprenticeship Marketplace for Skilled Trades" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
    scripts: [
      {
        // Replace data-domain with your actual domain once registered
        src: "https://plausible.io/js/script.js",
        defer: true,
        "data-domain": "tradelaunch.work",
      },
    ],
  }),
  notFoundComponent: () => <NotFound />,
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
