// src/test/mock-tanstack-start.ts
import { vi } from "vite-plus/test";

vi.mock("@tanstack/start-server-core", () => ({
  appendResponseHeader: () => {},
  createStartHandler: () => () => new Response(""),
  getRequest: () => new Request("http://localhost"),
  setResponseStatus: () => {},
}));
