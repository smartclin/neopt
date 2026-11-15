/// <reference types="vite-plus/test/globals" />
import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

declare module "vitest" {
  interface Assertion<T = unknown>
    extends jest.Matchers<void, T>, TestingLibraryMatchers<T, void> {}

  interface AsymmetricMatchersContaining extends jest.Matchers<void, unknown> {}
}
