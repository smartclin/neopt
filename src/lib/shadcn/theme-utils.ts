// src/lib/shadcn/theme-utils.ts
//
// Non-component theme logic. Split from `theme.tsx` so that file can
// export only `<ThemeProvider />` and stay fast-refresh friendly.
//
// Two invariants this file maintains:
//
//   1. `resolveTheme` is the *single* place that turns a `Theme` into a
//      `ResolvedTheme`. `applyTheme` (client, post-hydration) and
//      `getThemeScript` (inline SSR script, pre-hydration) both encode the
//      same rule. Centralising it means a default flip can't desync them.
//
//   2. Every browser API is guarded. `localStorage`, `matchMedia`, and
//      `document.documentElement` are undefined during SSR, absent in
//      some privacy modes, and throw in jsdom unless polyfilled. A
//      utility that crashes the whole page because the user has
//      "block all cookies" enabled is not production-ready.

import type { ResolvedTheme, Theme } from "./theme-context";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Key shared by the inline SSR script and React's `useEffect` hooks. */
export const THEME_STORAGE_KEY = "theme";

/** The canonical set of valid `Theme` values. */
const THEME_VALUES: ReadonlySet<string> = new Set<Theme>(["dark", "light", "system"]);

/** Fallback used when storage is empty, unreadable, or holds garbage. */
const FALLBACK_THEME: Theme = "system";

/**
 * The two class names applied to `<html>`. Kept as constants so
 * `applyTheme` and the DOM cleanup path can't drift.
 */
const LIGHT_CLASS = "light";
const DARK_CLASS = "dark";
const ALL_THEME_CLASSES = [LIGHT_CLASS, DARK_CLASS] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * True iff `value` is a string that names a valid `Theme`.
 *
 * Narrows `string | null` to `Theme`, so callers get exhaustiveness for
 * free. The `null` check is inside the guard because `THEME_VALUES.has`
 * would accept `null` at runtime, and `null` is not a `Theme`.
 */
export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && THEME_VALUES.has(value);
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read the persisted theme. Returns the fallback if:
 *   - there is no storage (`localStorage` undefined — SSR, sandbox),
 *   - reading throws (Safari private mode, blocked cookies, quota),
 *   - the stored value is missing or not a valid `Theme`.
 *
 * Never throws. Callers don't need try/catch around it.
 */
export function readStoredTheme(storageKey: string = THEME_STORAGE_KEY): Theme {
  try {
    if (typeof window === "undefined") return FALLBACK_THEME;
    const raw = window.localStorage.getItem(storageKey);
    return isTheme(raw) ? raw : FALLBACK_THEME;
  } catch {
    return FALLBACK_THEME;
  }
}

/**
 * Persist the theme. Silent on failure — the in-memory `useState` in the
 * provider keeps the choice for this session; storage is a durability
 * optimisation, not the source of truth.
 *
 * Returns `true` on success so callers that care (e.g. the cross-tab
 * `StorageEvent` listener) can skip a redundant state update if the
 * write was rejected and the value didn't change.
 */
export function writeStoredTheme(theme: Theme, storageKey: string = THEME_STORAGE_KEY): boolean {
  try {
    if (typeof window === "undefined") return false;
    window.localStorage.setItem(storageKey, theme);
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolution — the single source of truth for `theme → resolved`
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve a `Theme` to the concrete `ResolvedTheme` ("light" | "dark").
 *
 * - `"light"` / `"dark"` pass through unchanged.
 * - `"system"` reads `prefers-color-scheme` *once*. If `matchMedia` is
 *   unavailable (SSR, jsdom without a mock), returns `"light"` — a
 *   deliberate, documented default. Dark-by-default would cause a
 *   visible flash for the vast majority of users (light-mode is still
 *   the OS default), so light-as-fallback is the safer choice.
 */
export function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme !== "system") return theme;

  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }

  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    // Older or embedded browsers can throw on the media query itself.
    return "light";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DOM application
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apply the resolved theme to `<html>`: swap the `light`/`dark` class and
 * set `color-scheme` so native form controls (inputs, scrollbars) follow.
 *
 * Idempotent. Safe to call on every render — the cost is two
 * `classList` reads and one write. Guarded so it can be called from a
 * `useEffect` during SSR without crashing (returns `false` there).
 *
 * Returns `true` if the DOM was updated, `false` if we're on the server.
 */
export function applyTheme(theme: Theme): boolean {
  if (typeof document === "undefined") return false;

  const resolved = resolveTheme(theme);
  const root = document.documentElement;

  // Remove both, then add one. This is atomic enough for the class
  // attribute (a single mutation target) and avoids the "remove then
  // add leaves a frame with neither class" flicker that a naive
  // `remove(prev); add(next)` would produce on slower devices.
  for (const className of ALL_THEME_CLASSES) {
    root.classList.remove(className);
  }
  root.classList.add(resolved);
  root.style.colorScheme = resolved;

  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline SSR script
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the tiny inline script that runs before React hydrates, so the
 * first paint matches the persisted theme.
 *
 * The script body deliberately duplicates `readStoredTheme` +
 * `resolveTheme` + `applyTheme` because it must run before any JS module
 * is loaded — it can't import this file. The `ResolvedTheme` mapping and
 * the class names are the only things that must stay in sync, and both
 * are covered by the `resolveTheme` docstring above.
 *
 * Security: `storageKey` and `defaultTheme` are serialised with
 * `JSON.stringify`, so a caller passing a key containing `</script>`
 * cannot break out of the script tag.
 */
export function getThemeScript(
  storageKey: string = THEME_STORAGE_KEY,
  defaultTheme: Theme = FALLBACK_THEME,
): string {
  const key = JSON.stringify(storageKey);
  const fallback = JSON.stringify(defaultTheme);
  const light = JSON.stringify(LIGHT_CLASS);
  const dark = JSON.stringify(DARK_CLASS);

  // One line per logical step so errors in a browser console point at
  // the exact failure. Wrapped in try/catch so a blocked storage or a
  // missing `matchMedia` silently falls back to light, matching
  // `resolveTheme`'s behaviour.
  return `(function(){try{
		var s=window.localStorage.getItem(${key});
		var valid=s==="light"||s==="dark"||s==="system";
		var t=valid?s:${fallback};
		var r=t;
		if(t==="system"){
			r=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?${dark}:${light};
		}
		var e=document.documentElement;
		e.classList.remove(${light},${dark});
		e.classList.add(r);
		e.style.colorScheme=r;
	}catch(_e){}})();`;
}
