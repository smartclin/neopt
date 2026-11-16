// src/routes/_guest/forgot-password.tsx
import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftIcon, LoaderCircleIcon, MailIcon } from "lucide-react";
import * as React from "react";
import { z } from "zod";

import { Button } from "#/components/ui/button.tsx";
import { Field, FieldLabel } from "#/components/ui/field.tsx";
import { Input } from "#/components/ui/input.tsx";
import { toast } from "#/components/ui/toast.tsx";
import { authClient } from "#/lib/auth-client.ts";

export const Route = createFileRoute("/_guest/forgot-password")({
  component: ForgotPasswordForm,
});

const forgotSchema = z.object({
  email: z.email("Invalid email address"),
});

/**
 * Better Auth sends the reset link to `redirectTo`, appending `?token=…`.
 * The link in the email must point at a route inside this app, e.g.
 * `/reset-password?token=abc`.
 */
const RESET_PAGE_PATH = "/reset-password";

function ForgotPasswordForm() {
  const [submitted, setSubmitted] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm({
    defaultValues: { email: "" },
    validators: { onSubmit: forgotSchema },
    onSubmit: async ({ value }) => {
      setError(null);
      setPending(true);
      try {
        const { error: authError } = await authClient.requestPasswordReset({
          email: value.email.trim(),
          redirectTo: `${window.location.origin}${RESET_PAGE_PATH}`,
        });
        if (authError) {
          throw new Error(authError.message || "Could not send the reset email.");
        }
        setSubmitted(true);
        toast.add({
          type: "success",
          description: "Check your inbox for a reset link.",
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not send the reset email.";
        setError(message);
        toast.add({ type: "error", description: message });
      } finally {
        setPending(false);
      }
    },
  });

  if (submitted) {
    return (
      <div className="flex flex-col gap-6">
        <div className="space-y-1.5 text-center">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Check your email
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            If an account exists for that address, a reset link is on its way. The link expires in
            15 minutes.
          </p>
        </div>
        <Button className="h-11 w-full" nativeButton={false} render={<Link to="/login" />}>
          <ArrowLeftIcon aria-hidden="true" className="size-4" />
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1.5 text-center">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Forgot password?
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Enter the email you signed up with and we&apos;ll send a reset link.
        </p>
      </div>

      <form
        aria-busy={pending}
        className="space-y-6"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (pending) return;
          void form.handleSubmit();
        }}
      >
        <form.Field name="email">
          {(field) => {
            const err = field.state.meta.errors[0];
            const message =
              typeof err === "string"
                ? err
                : err && typeof err === "object" && "message" in err
                  ? String((err as { message: unknown }).message)
                  : undefined;
            return (
              <Field>
                <FieldLabel htmlFor="forgot-email">Email address</FieldLabel>
                <Input
                  aria-describedby={message ? "forgot-email-error" : undefined}
                  aria-invalid={Boolean(message) || Boolean(error)}
                  autoComplete="email"
                  className="h-11"
                  id="forgot-email"
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="doctor@clinic.com"
                  readOnly={pending}
                  required
                  type="email"
                  value={field.state.value}
                />
                {message && (
                  <p className="text-destructive text-sm" id="forgot-email-error" role="alert">
                    {message}
                  </p>
                )}
              </Field>
            );
          }}
        </form.Field>

        {error && (
          <p className="text-destructive text-sm font-medium" role="alert">
            {error}
          </p>
        )}

        <Button className="h-11 w-full" disabled={pending} type="submit">
          {pending ? (
            <LoaderCircleIcon aria-hidden="true" className="size-5 animate-spin" />
          ) : (
            <MailIcon aria-hidden="true" className="size-5" />
          )}
          {pending ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        Remembered it?{" "}
        <Link className="text-primary font-semibold hover:underline" to="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
