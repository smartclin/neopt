// src/routes/_guest/login.tsx
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, EyeIcon, EyeOffIcon, LoaderCircleIcon } from "lucide-react";
import * as React from "react";
import { z } from "zod";

import { SocialSignInButtons } from "#/components/sign-in-social-buttons.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Field, FieldLabel } from "#/components/ui/field.tsx";
import { Input } from "#/components/ui/input.tsx";
import { toast } from "#/components/ui/toast.tsx";
import { authClient } from "#/lib/auth-client.ts";
import { authQueryOptions } from "#/lib/auth/queries.ts";

export const Route = createFileRoute("/_guest/login")({
  component: LoginForm,
});

const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/** TanStack Form's `field.state.meta.errors` is `unknown[]`. Normalize it. */
function fieldErrorMessage(err: unknown): string | undefined {
  if (!err) return undefined;
  if (typeof err === "string") return err;
  if (typeof err === "object" && "message" in err) {
    const m = (err as { message: unknown }).message;
    if (typeof m === "string") return m;
  }
  return undefined;
}

function LoginForm() {
  const { redirectUrl } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = React.useState<string | null>(null);
  const [capsLock, setCapsLock] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const errorId = React.useId();

  const login = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const { error: authError } = await authClient.signIn.email({
        ...data,
        callbackURL: redirectUrl,
      });
      if (authError) {
        throw new Error(authError.message || "Invalid email or password.");
      }
    },
    onSuccess: async () => {
      // Invalidate AND refetch so the session is live before we navigate.
      // If this fails, we stay on /login with an error rather than
      // bouncing between /login -> /app -> /login.
      await queryClient.invalidateQueries({
        queryKey: authQueryOptions().queryKey,
      });
      const user = await queryClient.query(authQueryOptions());
      if (!user) {
        throw new Error("Signed in, but the session could not be loaded. Try refreshing the page.");
      }
      void navigate({ to: redirectUrl || "/app", replace: true });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Invalid email or password.";
      setError(message);
      toast.add({ type: "error", description: message });
    },
  });

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: { onSubmit: loginSchema },
    onSubmit: async ({ value }) => {
      setError(null);
      await login.mutateAsync(value);
    },
  });

  const isPending = login.isPending;

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1.5 text-center">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Welcome back
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Sign in to manage your clinic.</p>
      </div>

      <form
        aria-busy={isPending}
        className="space-y-6"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (isPending) return;
          void form.handleSubmit();
        }}
      >
        <div className="space-y-4">
          <form.Field name="email">
            {(field) => {
              const message = fieldErrorMessage(field.state.meta.errors[0]);
              return (
                <Field>
                  <FieldLabel htmlFor="email">Email address</FieldLabel>
                  <Input
                    aria-describedby={error ? errorId : undefined}
                    aria-invalid={Boolean(message) || Boolean(error)}
                    autoComplete="email"
                    className="h-11"
                    id="email"
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="doctor@clinic.com"
                    readOnly={isPending}
                    required
                    type="email"
                    value={field.state.value}
                  />
                  {message && (
                    <p className="text-destructive text-xs" role="alert">
                      {message}
                    </p>
                  )}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="password">
            {(field) => {
              const message = fieldErrorMessage(field.state.meta.errors[0]);
              const describedBy =
                [
                  error ? errorId : null,
                  capsLock ? "login-caps-lock" : null,
                  message ? "login-password-error" : null,
                ]
                  .filter(Boolean)
                  .join(" ") || undefined;

              return (
                <Field>
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Link
                      className="text-primary text-xs font-medium hover:underline"
                      to="/forgot-password"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  {/* Flex wrapper: input fills the row, eye button sits on the right edge. */}
                  <div className="flex items-center gap-1">
                    <Input
                      aria-describedby={describedBy}
                      aria-invalid={Boolean(message) || Boolean(error)}
                      autoComplete="current-password"
                      id="password"
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onKeyUp={(e) => setCapsLock(e.getModifierState?.("CapsLock") ?? false)}
                      placeholder="••••••••"
                      readOnly={isPending}
                      required
                      type={showPassword ? "text" : "password"}
                      value={field.state.value}
                    />

                    <button
                      aria-controls="password"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      className=" hover:text-foreground focus-visible:ring-ring focus-visible:ring-offset-background shrink-0 rounded-md p-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                      disabled={isPending}
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                      type="button"
                    >
                      {showPassword ? (
                        <EyeOffIcon aria-hidden="true" className="size-4" />
                      ) : (
                        <EyeIcon aria-hidden="true" className="size-4" />
                      )}
                    </button>
                  </div>

                  {capsLock && (
                    <p className=" text-xs" id="login-caps-lock">
                      Caps Lock is on.
                    </p>
                  )}

                  {message && (
                    <p className="text-destructive text-xs" id="login-password-error" role="alert">
                      {message}
                    </p>
                  )}
                </Field>
              );
            }}
          </form.Field>

          {error && (
            <p
              className="animate-in text-destructive fade-in slide-in-from-top-1 text-sm font-medium"
              id={errorId}
              role="alert"
            >
              {error}
            </p>
          )}

          <Button className="mt-2 h-11 w-full" disabled={isPending} type="submit">
            {isPending ? (
              <LoaderCircleIcon aria-hidden="true" className="size-5 animate-spin" />
            ) : (
              <ArrowRight aria-hidden="true" className="size-5" />
            )}
            {isPending ? "Signing in..." : "Sign In"}
          </Button>
        </div>

        <SocialSignInButtons callbackURL={redirectUrl} disabled={isPending} />
      </form>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        Don&apos;t have an account?{" "}
        <Link className="text-primary font-semibold hover:underline" to="/signup">
          Create one
        </Link>
      </p>
    </div>
  );
}
