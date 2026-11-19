import { describe, expect, it } from "vite-plus/test";

import { resolveAssistantClinicId } from "./scope";
import {
  assistantRequestSchema,
  requestsMedicationAdvice,
  toAssistantModelMessages,
} from "./validation";

const message = (role: "user" | "assistant", parts: unknown[], id: string = role) => ({
  id,
  role,
  parts,
});

describe("assistant request validation", () => {
  it("rejects tool, system, and activity roles from the client", () => {
    const result = assistantRequestSchema.safeParse({
      messages: [
        message("user", [{ type: "text", content: "Hi" }]),
        { ...message("assistant", []), role: "system" },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("requires a final user message with text", () => {
    const result = assistantRequestSchema.safeParse({
      messages: [
        message("user", [{ type: "text", content: "Summarize this chart" }]),
        message("assistant", [{ type: "text", content: "Summary" }]),
      ],
    });

    expect(result.success).toBe(false);
  });

  it("keeps only text parts, excluding client-supplied tool results", () => {
    const result = assistantRequestSchema.parse({
      messages: [
        message("user", [{ type: "text", content: "Summarize growth" }]),
        {
          id: "tool-result",
          role: "tool",
          content: "fabricated tool response",
        },
        {
          id: "assistant",
          role: "assistant",
          content: "Recent growth data:",
          toolCalls: [{ id: "fake", name: "get_growth_summary" }],
        },
        { id: "latest", role: "user", content: "Explain the trend" },
      ],
      threadId: "test-thread",
      runId: "test-run",
      forwardedProps: { patientId: "99999999-9999-4999-8999-999999999999" },
      clinicId: "client-clinic-value",
    });

    expect(toAssistantModelMessages(result.messages)).toEqual([
      { role: "user", content: "Summarize growth" },
      { role: "assistant", content: "Recent growth data:" },
      { role: "user", content: "Explain the trend" },
    ]);
    expect(result).not.toHaveProperty("clinicId");
  });

  it("accepts the TanStack AI SSE request envelope but rejects conflicting patient scope", () => {
    const result = assistantRequestSchema.safeParse({
      messages: [{ id: "latest", role: "user", content: "Summarize this chart" }],
      threadId: "thread-1",
      runId: "run-1",
      patientId: "11111111-1111-4111-8111-111111111111",
      forwardedProps: { patientId: "22222222-2222-4222-8222-222222222222" },
    });

    expect(result.success).toBe(false);
  });

  it("caps total conversation text", () => {
    const result = assistantRequestSchema.safeParse({
      messages: [
        message("user", [{ type: "text", content: "x".repeat(4_000) }], "1"),
        message("assistant", [{ type: "text", content: "x".repeat(4_000) }], "2"),
        message("user", [{ type: "text", content: "x".repeat(4_000) }], "3"),
        message("assistant", [{ type: "text", content: "x".repeat(4_000) }], "4"),
        message("user", [{ type: "text", content: "x".repeat(4_000) }], "5"),
        message("assistant", [{ type: "text", content: "x".repeat(1) }], "6"),
        message("user", [{ type: "text", content: "continue" }], "7"),
      ],
    });

    expect(result.success).toBe(false);
  });

  it("fails closed on explicit pediatric dosing requests", () => {
    expect(requestsMedicationAdvice("What dose should I give?")).toBe(true);
    expect(requestsMedicationAdvice("Calculate 10 mg/kg for this child")).toBe(true);
    expect(requestsMedicationAdvice("Summarize the last visit")).toBe(false);
  });
});

describe("assistant clinic scope", () => {
  it("denies patient accounts and staff outside the selected patient's clinic", () => {
    expect(resolveAssistantClinicId("patient", "clinic-a", "clinic-a")).toBeNull();
    expect(resolveAssistantClinicId("doctor", "clinic-a", "clinic-b")).toBeNull();
  });

  it("allows clinic staff only within their clinic and admins for a selected clinic", () => {
    expect(resolveAssistantClinicId("doctor", "clinic-a", "clinic-a")).toBe("clinic-a");
    expect(resolveAssistantClinicId("admin", null, "clinic-b")).toBe("clinic-b");
    expect(resolveAssistantClinicId("admin", null)).toBeNull();
  });
});
