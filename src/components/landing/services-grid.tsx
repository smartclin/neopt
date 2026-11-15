import { Link } from "@tanstack/react-router";

// ---------------------------------------------------------------------------
// Icons (hoisted out of the data so they're stable references)
// ---------------------------------------------------------------------------

const HeartIcon = (
  <svg
    aria-hidden="true"
    className="h-6 w-6"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
  >
    <path
      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SyringeIcon = (
  <svg
    aria-hidden="true"
    className="h-6 w-6"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
  >
    <path
      d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const UserIcon = (
  <svg
    aria-hidden="true"
    className="h-6 w-6"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
  >
    <path
      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ---------------------------------------------------------------------------
// Data — typed with TanStack's known route literals
// ---------------------------------------------------------------------------

type ServiceLink =
  | "/services/newborn-care"
  | "/services/immunizations"
  | "/services/sick-visits"
  | "/services/chronic-care"
  | "/services/developmental-screening"
  | "/services/well-child";

type Service = {
  title: string;
  image: string;
  href: ServiceLink;
  icon: React.ReactNode;
};

const SERVICES: readonly Service[] = [
  {
    title: "Newborn Care",
    image: "/images/lactation-counseling.webp",
    href: "/services/newborn-care",
    icon: HeartIcon,
  },
  {
    title: "Immunizations",
    image: "/images/vaccination.webp",
    href: "/services/immunizations",
    icon: SyringeIcon,
  },
  {
    title: "Sick Visits",
    image: "/images/sick-child.webp",
    href: "/services/sick-visits",
    icon: HeartIcon,
  },
  {
    title: "Chronic Care",
    image: "/images/consultation.webp",
    href: "/services/chronic-care",
    icon: HeartIcon,
  },
  {
    title: "Developmental Screening",
    image: "/images/development.webp",
    href: "/services/developmental-screening",
    icon: HeartIcon,
  },
  {
    title: "Well-Child Visits",
    image: "/images/growth-development.webp",
    href: "/services/well-child",
    icon: UserIcon,
  },
];

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

function ServiceCard({ service }: { service: Service }) {
  return (
    <Link
      className="group border-border/50 bg-muted hover:shadow-primary/10 focus-visible:ring-primary relative flex aspect-[4/3] overflow-hidden rounded-3xl border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      preload="intent"
      to={service.href}
    >
      <img
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        decoding="async"
        loading="lazy"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        src={service.image}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Icon badge */}
      <div className="absolute top-4 left-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/30 bg-white/20 text-white shadow-sm backdrop-blur-md">
        {service.icon}
      </div>

      {/* Title */}
      <div className="absolute inset-x-0 bottom-0 p-6">
        <h3 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{service.title}</h3>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

export function ServicesGrid() {
  return (
    <section
      aria-labelledby="services-heading"
      className="border-border/60 bg-background scroll-mt-24 border-t py-24"
      id="features"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            className="text-foreground text-3xl font-bold tracking-tight text-balance sm:text-4xl"
            id="services-heading"
          >
            Comprehensive care for every stage
          </h2>
          <p className="text-muted-foreground mt-4 text-lg text-pretty">
            From the first newborn checkup to developmental milestones, we've got your clinic
            covered.
          </p>
        </div>

        <ul className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service) => (
            <li key={service.href}>
              <ServiceCard service={service} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
