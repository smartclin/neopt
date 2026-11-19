import * as React from "react";

import { toast } from "@/components/ui/toast";

type SubmitOutcome = { form: string } | undefined;

interface UseMutationFormOptions<TValues, TResult> {
  /** The mutation call. Throw to signal failure; return value goes to `onSuccess`. */
  submit: (values: TValues) => Promise<TResult>;
  /** Called after a successful submit — reset the form, close the dialog, etc. */
  onSuccess?: (result: TResult, values: TValues) => void;
  /** Toast shown on success. Omit to suppress. */
  successToast?: string;
  /** Toast shown on failure. Defaults to the thrown error's message. */
  errorToast?: string | ((error: unknown) => string);
}

/**
 * Wraps TanStack Form's `onSubmitAsync` contract (return `undefined` on
 * success, `{ form: string }` on failure) around a mutation, so every form
 * gets the same toast + error-map behaviour without copy-paste.
 */
export function useMutationFormSubmit<TValues, TResult>({
  submit,
  onSuccess,
  successToast,
  errorToast,
}: UseMutationFormOptions<TValues, TResult>) {
  return React.useCallback(
    async ({ value }: { value: TValues }): Promise<SubmitOutcome> => {
      try {
        const result = await submit(value);
        if (successToast) toast.add({ type: "success", description: successToast });
        onSuccess?.(result, value);
        return undefined;
      } catch (error) {
        const message =
          typeof errorToast === "function"
            ? errorToast(error)
            : (errorToast ?? (error instanceof Error ? error.message : "Request failed"));
        return { form: message };
      }
    },
    [submit, onSuccess, successToast, errorToast],
  );
}
