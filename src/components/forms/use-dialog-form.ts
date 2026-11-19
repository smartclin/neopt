import * as React from "react";

/**
 * Shared open/close + reset-on-close behaviour for dialog-hosted forms.
 * `reset` should be a stable callback (use `React.useCallback` or a
 * module-level `buildDefaults`).
 */
export function useDialogForm<TForm extends { reset: (values?: unknown) => void }>(
  form: TForm,
  resetValues: unknown,
) {
  const [open, setOpen] = React.useState(false);

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      setOpen(next);
      if (!next) form.reset(resetValues);
    },
    [form, resetValues],
  );

  return { open, setOpen, handleOpenChange };
}
