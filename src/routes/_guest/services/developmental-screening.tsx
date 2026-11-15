import { getService } from "@data/services";
import { createFileRoute } from "@tanstack/react-router";
import { ServiceLayout } from "#/components/blocks/ServiceLayout.tsx";

export const Route = createFileRoute("/_guest/services/developmental-screening")({
  head: () => ({
    meta: [
      { title: "Developmental Screening — Pediatric Clinic" },
      {
        name: "description",
        content: getService("developmental-screening").tagline,
      },
    ],
  }),
  component: () => <ServiceLayout service={getService("developmental-screening")} />,
});
