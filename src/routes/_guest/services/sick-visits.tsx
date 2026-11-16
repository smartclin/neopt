import { createFileRoute } from "@tanstack/react-router";

import { ServiceLayout } from "#/components/blocks/ServiceLayout.tsx";
import { getService } from "#/components/services.tsx";

export const Route = createFileRoute("/_guest/services/sick-visits")({
  head: () => ({
    meta: [
      { title: "Sick Visits — Pediatric Clinic" },
      { name: "description", content: getService("sick-visits").tagline },
    ],
  }),
  component: () => <ServiceLayout service={getService("sick-visits")} />,
});
