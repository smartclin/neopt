import { getService } from "@data/services";
import { createFileRoute } from "@tanstack/react-router";
import { ServiceLayout } from "#/components/blocks/ServiceLayout.tsx";

export const Route = createFileRoute("/_guest/services/immunizations")({
  head: () => ({
    meta: [
      { title: "Immunizations — Pediatric Clinic" },
      { name: "description", content: getService("immunizations").tagline },
    ],
  }),
  component: () => <ServiceLayout service={getService("immunizations")} />,
});
