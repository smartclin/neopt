import { Link } from "@tanstack/react-router";

export default function Footer() {
  const year = 2026;

  return (
    <footer className="site-footer mt-20 px-4 py-10 text-[var(--sea-ink-soft)]">
      <div className="page-wrap flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-sm">
          <Link
            className="font-display text-lg font-semibold text-[var(--sea-ink)] no-underline"
            to="/"
          >
            Smart Clinic
          </Link>
          <p className="mt-2 text-sm leading-relaxed">
            Pediatric care, thoughtfully connected — from the first visit to every milestone.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
          <Link className="transition hover:text-[var(--sea-ink)]" to="/about">
            About
          </Link>
          <Link className="transition hover:text-[var(--sea-ink)]" to="/login">
            Sign in
          </Link>
        </nav>
      </div>
      <div className="page-wrap mt-8 border-t border-[var(--line)] pt-5 text-xs">
        © {year} Smart Clinic. All rights reserved.
      </div>
    </footer>
  );
}
