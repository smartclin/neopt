import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth-client";

import { Icons } from "./icons";

interface SocialLoginButtonProps {
  provider: string;
  icon: React.ReactNode;
  disabled?: boolean;
  callbackURL: string;
}

function SignInSocialButton(props: SocialLoginButtonProps) {
  const providerLabel =
    props.provider === "github"
      ? "GitHub"
      : props.provider.charAt(0).toUpperCase() + props.provider.slice(1);

  const mutation = useMutation({
    mutationFn: async () =>
      await authClient.signIn.social(
        {
          provider: props.provider,
          callbackURL: props.callbackURL,
        },
        {
          onError: ({ error }) => {
            toast.add({
              type: "error",
              description: error.message || `An error occurred during ${providerLabel} sign-in.`,
            });
          },
        },
      ),
  });

  return (
    <Button
      className="w-full"
      disabled={mutation.isSuccess || mutation.isPending || props.disabled}
      onClick={() => mutation.mutate()}
      size="lg"
      type="button"
      variant="outline"
    >
      {props.icon}
      Continue with {providerLabel}
    </Button>
  );
}

export function SocialSignInButtons({
  callbackURL,
  disabled,
}: Pick<SocialLoginButtonProps, "callbackURL" | "disabled">) {
  const isPreviewDeployment = false;

  return (
    <>
      <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:border-t">
        <span className="bg-background text-muted-foreground relative z-10 px-2">Or</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <SignInSocialButton
          callbackURL={callbackURL}
          disabled={disabled}
          icon={<Icons.github className="size-4" />}
          provider="github"
        />
        <SignInSocialButton
          callbackURL={callbackURL}
          disabled={disabled || isPreviewDeployment}
          icon={<Icons.google className="size-4" />}
          provider="google"
        />
      </div>
    </>
  );
}
