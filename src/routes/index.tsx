import { createFileRoute, redirect } from "@tanstack/react-router";

import { ServicesGrid } from "#/components/landing/services-grid.tsx";
import { authQueryOptions } from "#/lib/auth/queries.ts";
import { CtaSection } from "@/components/landing/cta-section";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { Footer } from "@/components/landing/footer";
import { GrowthPreview } from "@/components/landing/growth-preview";
import { Hero } from "@/components/landing/hero";
import { TrustBar } from "@/components/landing/trust-bar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "G-Tracker — Pediatric clinic platform with WHO & Egyptian growth charts",
      },
      {
        name: "description",
        content:
          "Patient records, growth charts, immunizations, pediatric dosing, and visit notes for pediatric clinics.",
      },
      {
        property: "og:title",
        content: "G-Tracker — Pediatric clinic platform",
      },
      {
        property: "og:description",
        content:
          "WHO & Egyptian growth charts, immunization tracking, and pediatric dosing calculators.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://yourdomain.com/" }],
  }),
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.query({
      ...authQueryOptions(),
      staleTime: "static",
    });
    if (user) {
      throw redirect({ to: "/app" });
    }
  },
  component: LandingPage,
});

function LandingPage() {
  return (
    <main className="bg-background min-h-dvh">
      <Hero />
      <TrustBar />

      {/* The new 6-image grid */}
      <ServicesGrid />

      <FeatureGrid />
      <GrowthPreview />
      <CtaSection />
      <Footer />
    </main>
  );
}
