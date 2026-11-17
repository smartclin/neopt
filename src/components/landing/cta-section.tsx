import { Link } from "@tanstack/react-router";

export function CtaSection() {
  return (
    <section className="bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="border-primary/20 from-primary/10 via-secondary/5 shadow-primary/10 relative overflow-hidden rounded-3xl border bg-gradient-to-br to-transparent p-10 text-center shadow-xl sm:p-16">
          <h2 className="text-foreground mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Bring calm to your clinic day
          </h2>
          <p className=" mx-auto mt-4 max-w-xl text-lg">
            Create an account in seconds — no credit card required. Bring your whole team on board
            and start recording visits today.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              className="bg-primary text-primary-foreground shadow-primary/25 hover:bg-primary/90 focus-visible:ring-ring inline-flex h-12 items-center justify-center rounded-xl px-8 text-sm font-semibold shadow-lg transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              to="/signup"
            >
              Get started
            </Link>
            <Link
              className="border-border bg-background text-foreground hover:bg-muted focus-visible:ring-ring inline-flex h-12 items-center justify-center rounded-xl border px-8 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              to="/login"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
