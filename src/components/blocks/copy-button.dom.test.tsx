import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import { CopyButton } from "@/components/blocks/copy-button";

function setup(options?: Parameters<typeof userEvent.setup>[0]) {
  const user = userEvent.setup(options);
  render(<CopyButton label="Copy pnpm install" value="pnpm install" />);
  return user;
}

const copyButton = () => screen.getByRole("button", { name: "Copy pnpm install" });

describe("CopyButton", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("copies its value and announces it", async () => {
    const user = setup();

    await user.click(copyButton());

    expect(await navigator.clipboard.readText()).toBe("pnpm install");
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Copied");
  });

  it("goes back to its label after two seconds", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });

    await user.click(copyButton());
    await screen.findByRole("button", { name: "Copied" });

    // Flush the effect that starts the reset timer before moving the clock.
    await act(async () => {});

    // Advance the fake clock, then flush the microtasks the timer queued.
    await act(async () => {
      vi.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    expect(copyButton()).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
  it("claims nothing when the clipboard refuses the write", async () => {
    const user = setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("Denied"));

    await user.click(copyButton());

    expect(copyButton()).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});
