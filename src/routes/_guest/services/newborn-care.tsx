import { createFileRoute } from "@tanstack/react-router";

import { ServiceLayout } from "#/components/blocks/ServiceLayout.tsx";
import { getService } from "#/components/services";

export const Route = createFileRoute("/_guest/services/newborn-care")({
  head: () => ({
    meta: [
      { title: "Newborn Care — Pediatric Clinic" },
      { name: "description", content: getService("newborn-care").tagline },
    ],
  }),
  component: () => <ServiceLayout service={getService("newborn-care")} />,
});
