import { getService } from "@data/services";
import { createFileRoute } from "@tanstack/react-router";
import { ServiceLayout } from "#/components/blocks/ServiceLayout.tsx";

export const Route = createFileRoute("/_guest/services/chronic-care")({
  head: () => ({
    meta: [
      { title: "Chronic Care — Pediatric Clinic" },
      { name: "description", content: getService("chronic-care").tagline },
    ],
  }),
  component: () => <ServiceLayout service={getService("chronic-care")} />,
});
