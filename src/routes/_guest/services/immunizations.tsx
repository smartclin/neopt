import { createFileRoute } from "@tanstack/react-router";

import { ServiceLayout } from "#/components/blocks/ServiceLayout.tsx";
import { getService } from "#/components/services";

export const Route = createFileRoute("/_guest/services/immunizations")({
  head: () => ({
    meta: [
      { title: "Immunizations — Pediatric Clinic" },
      { name: "description", content: getService("immunizations").tagline },
    ],
  }),
  component: () => <ServiceLayout service={getService("immunizations")} />,
});
