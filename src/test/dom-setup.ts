// src/test/setup.dom.ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vite-plus/test";

import "./setup";
import "./mock-tanstack-start";

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (typeof window.scrollTo !== "function") {
  window.scrollTo = () => {};
}
// happy-dom doesn't implement scrollTo. TanStack Router calls it after
// navigation (router scroll restoration). Stub it to a no-op so the
// "Not implemented" warnings don't drown out real failures.
if (typeof window.scrollTo === "function") {
  window.scrollTo = () => {};
} else {
  Object.defineProperty(window, "scrollTo", {
    value: () => {},
    writable: true,
  });
}
if (typeof Element.prototype.scrollIntoView !== "function") {
  Element.prototype.scrollIntoView = () => {};
}

const defaultMatchMedia = (query: string): MediaQueryList => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
});

window.matchMedia = defaultMatchMedia;

afterEach(() => {
  cleanup();
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {}
  document.documentElement.className = "";
  document.documentElement.removeAttribute("style");
  vi.restoreAllMocks();
  window.matchMedia = defaultMatchMedia;
});
