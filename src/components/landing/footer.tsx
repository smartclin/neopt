import { Link } from "@tanstack/react-router";

const CURRENT_YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="border-border/60 bg-background border-t">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
        <p className=" text-sm">© {CURRENT_YEAR} G-Tracker. Built for pediatric care.</p>
        <nav className=" flex gap-6 text-sm">
          <a className="hover:text-foreground transition" href="#features">
            Features
          </a>
          <a className="hover:text-foreground transition" href="#growth">
            Growth
          </a>
          <Link className="hover:text-foreground transition" to="/privacy">
            Privacy
          </Link>
          <Link className="hover:text-foreground transition" to="/terms">
            Terms
          </Link>
          <Link className="hover:text-foreground transition" to="/login">
            Sign in
          </Link>
        </nav>
      </div>
    </footer>
  );
}
