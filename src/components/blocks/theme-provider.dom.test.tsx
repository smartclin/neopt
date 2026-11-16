import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vite-plus/test";

import { THEME_STORAGE_KEY } from "#/lib/shadcn/theme-utils.ts";
import { ThemeProvider } from "#/lib/shadcn/theme.tsx";
import { useTheme } from "@/hooks/use-theme";

function ThemeProbe() {
  const { resolvedTheme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} type="button">
      {resolvedTheme}
    </button>
  );
}

function setup() {
  render(
    <ThemeProvider>
      <ThemeProbe />
      <input aria-label="Notes" />
    </ThemeProvider>,
  );
  return userEvent.setup();
}

const isDark = () => document.documentElement.classList.contains("dark");

const mockSystemDark = () =>
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  );

describe("ThemeProvider", () => {
  it("follows a light system theme when nothing is saved", () => {
    setup();

    expect(isDark()).toBe(false);
    expect(screen.getByRole("button")).toHaveTextContent("light");
  });

  it("follows a dark system theme when nothing is saved", () => {
    mockSystemDark();
    setup();

    expect(isDark()).toBe(true);
    expect(screen.getByRole("button")).toHaveTextContent("dark");
  });

  it("toggles and remembers the choice", async () => {
    const user = setup();

    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(isDark()).toBe(true);
    });
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("toggles with the d key, but not while typing or with a modifier", async () => {
    const user = setup();

    await user.keyboard("d");
    await waitFor(() => expect(isDark()).toBe(true));

    await user.keyboard("{Shift>}D{/Shift}");
    // still dark — the state didn't change
    expect(isDark()).toBe(true);

    await user.click(screen.getByRole("textbox", { name: "Notes" }));
    await user.keyboard("d");
    expect(isDark()).toBe(true);
  });

  it("restores a saved theme", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    setup();

    expect(isDark()).toBe(true);
  });

  it("keeps working when storage is blocked", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });
    const user = setup();

    await user.click(screen.getByRole("button"));

    // The theme provider applies the theme even though storage
    // refused to persist it — the toggle still works in-session.
    await waitFor(() => expect(isDark()).toBe(true));
  });

  it("follows a change made in another tab", () => {
    setup();

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: THEME_STORAGE_KEY,
          newValue: "dark",
          storageArea: localStorage,
        }),
      );
    });

    expect(isDark()).toBe(true);
  });
});
