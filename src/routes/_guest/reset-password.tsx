// src/routes/_guest/reset-password.tsx
import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon, LoaderCircleIcon, ShieldCheckIcon } from "lucide-react";
import * as React from "react";
import { z } from "zod";

import { Button } from "#/components/ui/button.tsx";
import { Input } from "#/components/ui/input.tsx";
import { toast } from "#/components/ui/toast.tsx";
import { authClient } from "#/lib/auth-client.ts";
import { FieldLabel } from "@/components/ui/field";

export const Route = createFileRoute("/_guest/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : undefined,
    // Better Auth may append `?error=INVALID_TOKEN` when the link is bad.
    error: typeof search.error === "string" ? search.error : undefined,
  }),
  component: ResetPasswordForm,
});

const resetSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function ResetPasswordForm() {
  const { token, error: urlError } = Route.useSearch();
  const navigate = useNavigate();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(
    urlError === "INVALID_TOKEN"
      ? "This reset link is invalid or has expired. Request a new one."
      : null,
  );

  const form = useForm({
    defaultValues: { password: "", confirmPassword: "" },
    validators: { onSubmit: resetSchema },
    onSubmit: async ({ value }) => {
      if (!token) {
        setError("Missing reset token. Request a new link from the login page.");
        return;
      }
      setError(null);
      setPending(true);
      try {
        const { error: authError } = await authClient.resetPassword({
          newPassword: value.password,
          token,
        });
        if (authError) {
          throw new Error(authError.message || "Could not reset the password.");
        }
        toast.add({
          type: "success",
          description: "Password updated. Please sign in.",
        });
        void navigate({ to: "/login", replace: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not reset the password.";
        setError(message);
        toast.add({ type: "error", description: message });
      } finally {
        setPending(false);
      }
    },
  });

  // Missing / bad token — no point showing the form.
  if (!token) {
    return (
      <div className="flex flex-col gap-6">
        <div className="space-y-1.5 text-center">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Reset link is invalid
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {error ??
              "This link is missing a reset token. Request a new one from the sign-in page."}
          </p>
        </div>
        <Button
          className="w-full"
          nativeButton={false}
          render={<Link to="/forgot-password" />}
          size="lg"
        >
          Request a new link
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1.5 text-center">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Set a new password
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Choose a password of at least 8 characters.
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
        <div className="space-y-4">
          <form.Field name="password">
            {(field) => {
              const err = field.state.meta.errors[0];
              const message =
                typeof err === "string"
                  ? err
                  : err && typeof err === "object" && "message" in err
                    ? String((err as { message: unknown }).message)
                    : undefined;
              return (
                <div className="grid gap-2">
                  <FieldLabel htmlFor="reset-password">New password</FieldLabel>
                  <Input
                    aria-describedby={message ? "reset-password-error" : undefined}
                    aria-invalid={Boolean(message) || Boolean(error)}
                    autoComplete="new-password"
                    className="h-11"
                    id="reset-password"
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="At least 8 characters"
                    readOnly={pending}
                    required
                    type="password"
                    value={field.state.value}
                  />
                  {message && (
                    <p className="text-destructive text-sm" id="reset-password-error" role="alert">
                      {message}
                    </p>
                  )}
                </div>
              );
            }}
          </form.Field>

          <form.Field name="confirmPassword">
            {(field) => {
              const err = field.state.meta.errors[0];
              const message =
                typeof err === "string"
                  ? err
                  : err && typeof err === "object" && "message" in err
                    ? String((err as { message: unknown }).message)
                    : undefined;
              return (
                <div className="grid gap-2">
                  <FieldLabel htmlFor="reset-confirm">Confirm new password</FieldLabel>
                  <Input
                    aria-describedby={message ? "reset-confirm-error" : undefined}
                    aria-invalid={Boolean(message) || Boolean(error)}
                    autoComplete="new-password"
                    className="h-11"
                    id="reset-confirm"
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Repeat your password"
                    readOnly={pending}
                    required
                    type="password"
                    value={field.state.value}
                  />
                  {message && (
                    <p className="text-destructive text-sm" id="reset-confirm-error" role="alert">
                      {message}
                    </p>
                  )}
                </div>
              );
            }}
          </form.Field>

          {error && (
            <p className="text-destructive text-sm font-medium" role="alert">
              {error}
            </p>
          )}

          <Button className="w-full" disabled={pending} size="lg" type="submit">
            {pending ? (
              <LoaderCircleIcon aria-hidden="true" className="size-5 animate-spin" />
            ) : (
              <ShieldCheckIcon aria-hidden="true" className="size-5" />
            )}
            {pending ? "Updating…" : "Update password"}
          </Button>
        </div>
      </form>

      <div className="flex items-center justify-between text-sm">
        <Link
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 hover:underline"
          to="/login"
        >
          <ArrowLeftIcon aria-hidden="true" className="size-3.5" />
          Back to sign in
        </Link>
        <Link
          className="text-muted-foreground hover:text-foreground hover:underline"
          to="/forgot-password"
        >
          Request new link
        </Link>
      </div>
    </div>
  );
}
