import { createFileRoute, notFound } from "@tanstack/react-router";
import { NotFound } from "~/components/NotFound";

export const Route = createFileRoute("/$")({
  loader: () => {
    throw notFound();
  },
  component: NotFound,
});
