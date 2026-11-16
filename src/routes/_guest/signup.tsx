// src/routes/_guest/signup.tsx
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { EyeIcon, EyeOffIcon, LoaderCircleIcon, UserPlus } from "lucide-react";
import * as React from "react";
import { z } from "zod";

import { SocialSignInButtons } from "#/components/sign-in-social-buttons.tsx";
import { Button } from "#/components/ui/button.tsx";
import { Field, FieldLabel } from "#/components/ui/field.tsx";
import { Input } from "#/components/ui/input.tsx";
import { toast } from "#/components/ui/toast.tsx";
import { authClient } from "#/lib/auth-client.ts";
import { authQueryOptions } from "#/lib/auth/queries.ts";

export const Route = createFileRoute("/_guest/signup")({
  component: SignupForm,
});

const signupSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/** TanStack Form hands back `unknown[]`; pull a readable string out. */
function errorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message: unknown }).message;
    if (typeof m === "string") return m;
  }
  return "Invalid value";
}

function SignupForm() {
  const { redirectUrl } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);
  const [capsLock, setCapsLock] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const errorId = React.useId();

  // Declare the mutation BEFORE the form so `onSubmit` can reference it.
  const signup = useMutation({
    mutationFn: async (data: { name: string; email: string; password: string }) => {
      const { error: authError } = await authClient.signUp.email({
        ...data,
        callbackURL: redirectUrl,
      });
      if (authError) {
        throw new Error(authError.message || "An error occurred while creating your account.");
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: authQueryOptions().queryKey,
      });
      try {
        const user = await queryClient.query(authQueryOptions());
        if (user) {
          toast.add({
            type: "success",
            description: "Account created successfully!",
          });
          void navigate({ to: redirectUrl || "/app", replace: true });
          return;
        }
      } catch {
        // Query resolution failed, fallback to login page smoothly
      }

      // If the session cookie is not active yet, route smoothly to login
      toast.add({
        type: "success",
        description: "Account created successfully! Please sign in with your credentials.",
      });
      void navigate({ to: "/login", replace: true });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
      toast.add({ type: "error", description: message });
    },
  });

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validators: { onSubmit: signupSchema },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        await signup.mutateAsync({
          name: value.name.trim(),
          email: value.email,
          password: value.password,
        });
      } catch {
        // Handled in mutation onError
      }
    },
  });

  const isPending = signup.isPending;

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1.5 text-center">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Create an account
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Join the clinic portal to get started.
        </p>
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
          <form.Field name="name">
            {(field) => {
              const err = field.state.meta.errors[0];
              return (
                <Field>
                  <FieldLabel htmlFor="signup-name">Full name</FieldLabel>
                  <Input
                    aria-describedby={err ? "signup-name-error" : undefined}
                    aria-invalid={Boolean(err) || Boolean(error)}
                    autoComplete="name"
                    className="h-11"
                    disabled={isPending}
                    id="signup-name"
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Dr. Hazem Ali"
                    required
                    type="text"
                    value={field.state.value}
                  />
                  {err && (
                    <p className="text-destructive text-sm" id="signup-name-error" role="alert">
                      {errorMessage(err)}
                    </p>
                  )}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="email">
            {(field) => {
              const err = field.state.meta.errors[0];
              return (
                <Field>
                  <FieldLabel htmlFor="signup-email">Email address</FieldLabel>
                  <Input
                    aria-describedby={err ? "signup-email-error" : undefined}
                    aria-invalid={Boolean(err) || Boolean(error)}
                    autoComplete="email"
                    className="h-11"
                    disabled={isPending}
                    id="signup-email"
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="doctor@clinic.com"
                    required
                    type="email"
                    value={field.state.value}
                  />
                  {err && (
                    <p className="text-destructive text-sm" id="signup-email-error" role="alert">
                      {errorMessage(err)}
                    </p>
                  )}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="password">
            {(field) => {
              const err = field.state.meta.errors[0];
              const describedBy =
                [err ? "signup-password-error" : null, capsLock ? "signup-caps-lock" : null]
                  .filter(Boolean)
                  .join(" ") || undefined;

              return (
                <Field>
                  <FieldLabel htmlFor="signup-password">Password</FieldLabel>
                  <div className="relative">
                    <Input
                      aria-describedby={describedBy}
                      aria-invalid={Boolean(err) || Boolean(error)}
                      autoComplete="new-password"
                      className="h-11"
                      disabled={isPending}
                      id="signup-password"
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onKeyUp={(e) => setCapsLock(e.getModifierState?.("CapsLock") ?? false)}
                      placeholder="At least 8 characters"
                      required
                      type={showPassword ? "text" : "password"}
                      value={field.state.value}
                    />
                    <button
                      aria-controls="signup-password"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      className="text-muted-foreground hover:text-foreground focus-visible:ring-ring focus-visible:ring-offset-background absolute top-1/2 right-1 -translate-y-1/2 rounded-md p-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
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
                    <p className="text-muted-foreground text-xs" id="signup-caps-lock">
                      Caps Lock is on.
                    </p>
                  )}

                  {err && (
                    <p className="text-destructive text-sm" id="signup-password-error" role="alert">
                      {errorMessage(err)}
                    </p>
                  )}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="confirmPassword">
            {(field) => {
              const err = field.state.meta.errors[0];
              return (
                <Field>
                  <FieldLabel htmlFor="signup-confirm">Confirm password</FieldLabel>
                  <div className="relative">
                    <Input
                      aria-describedby={err ? "signup-confirm-error" : undefined}
                      aria-invalid={Boolean(err) || Boolean(error)}
                      autoComplete="new-password"
                      className="h-11"
                      disabled={isPending}
                      id="signup-confirm"
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Repeat your password"
                      required
                      type={showConfirmPassword ? "text" : "password"}
                      value={field.state.value}
                    />
                    <button
                      aria-controls="signup-confirm"
                      aria-label={
                        showConfirmPassword
                          ? "Hide password confirmation"
                          : "Show password confirmation"
                      }
                      aria-pressed={showConfirmPassword}
                      className="text-muted-foreground hover:text-foreground focus-visible:ring-ring focus-visible:ring-offset-background absolute top-1/2 right-1 -translate-y-1/2 rounded-md p-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                      disabled={isPending}
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      tabIndex={-1}
                      type="button"
                    >
                      {showConfirmPassword ? (
                        <EyeOffIcon aria-hidden="true" className="size-4" />
                      ) : (
                        <EyeIcon aria-hidden="true" className="size-4" />
                      )}
                    </button>
                  </div>
                  {err && (
                    <p className="text-destructive text-sm" id="signup-confirm-error" role="alert">
                      {errorMessage(err)}
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
              <UserPlus aria-hidden="true" className="size-5" />
            )}
            {isPending ? "Creating account..." : "Create Account"}
          </Button>
        </div>

        <SocialSignInButtons callbackURL={redirectUrl} disabled={isPending} />
      </form>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        Already have an account?{" "}
        <Link className="text-primary font-semibold hover:underline" to="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
