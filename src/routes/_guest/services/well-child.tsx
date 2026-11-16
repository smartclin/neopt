import { createFileRoute } from "@tanstack/react-router";

import { ServiceLayout } from "#/components/blocks/ServiceLayout.tsx";
import { getService } from "#/components/services.tsx";

export const Route = createFileRoute("/_guest/services/well-child")({
  head: () => ({
    meta: [
      { title: "Well-Child Visits — Pediatric Clinic" },
      { name: "description", content: getService("well-child").tagline },
    ],
  }),
  component: () => <ServiceLayout service={getService("well-child")} />,
});
