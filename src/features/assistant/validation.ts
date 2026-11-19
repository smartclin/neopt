import type { ModelMessage } from "@tanstack/ai";

import { z } from "zod";

export const MAX_ASSISTANT_MESSAGES = 40;
export const MAX_ASSISTANT_MESSAGE_CHARS = 4_000;
export const MAX_ASSISTANT_CONTEXT_CHARS = 20_000;

const medicationAdvicePatterns = [
  /\b(?:recommend|calculate|suggest|prescribe)\b.{0,50}\b(?:dose|dosage|medication|drug)\b/i,
  /\b(?:dose|dosage)\b.{0,50}\b(?:should|recommend|calculate|give|use|take)\b/i,
  /\bhow much\b.{0,50}\b(?:medicine|medication|drug|mg|ml)\b/i,
  /\b(?:mg|mcg|μg|ml)\s*\/\s*kg\b/i,
];

const messageSchema = z.object({
  id: z.string().max(128),
  role: z.enum(["user", "assistant", "tool"]),
  parts: z.array(z.unknown()).max(24).optional(),
  content: z.union([z.string().max(16_000), z.array(z.unknown()).max(24)]).optional(),
});

export const assistantRequestSchema = z
  .object({
    messages: z.array(messageSchema).min(1).max(MAX_ASSISTANT_MESSAGES),
    threadId: z.string().min(1).max(128).optional(),
    runId: z.string().min(1).max(128).optional(),
    patientId: z.uuid().optional(),
    forwardedProps: z
      .object({
        patientId: z.uuid().optional(),
      })
      .optional(),
  })
  .superRefine((request, context) => {
    if (
      request.patientId &&
      request.forwardedProps?.patientId &&
      request.patientId !== request.forwardedProps.patientId
    ) {
      context.addIssue({
        code: "custom",
        message: "Conflicting patient identifiers",
        path: ["patientId"],
      });
    }

    const lastMessage = request.messages.at(-1);
    if (lastMessage?.role !== "user" || !extractText(lastMessage).trim()) {
      context.addIssue({
        code: "custom",
        message: "The last assistant message must be a non-empty user message",
        path: ["messages"],
      });
    }

    let totalCharacters = 0;
    for (const [index, message] of request.messages.entries()) {
      const messageCharacters = extractText(message).length;
      if (messageCharacters > MAX_ASSISTANT_MESSAGE_CHARS) {
        context.addIssue({
          code: "custom",
          message: "Message exceeds the maximum length",
          path: ["messages", index],
        });
      }
      totalCharacters += messageCharacters;
    }

    if (totalCharacters > MAX_ASSISTANT_CONTEXT_CHARS) {
      context.addIssue({
        code: "custom",
        message: "Conversation exceeds the maximum context length",
        path: ["messages"],
      });
    }
  });

type ValidatedMessage = z.infer<typeof messageSchema>;

function extractText(message: ValidatedMessage): string {
  if (message.role === "tool") return "";

  const contents = message.parts ?? (Array.isArray(message.content) ? message.content : []);
  const textFromParts = contents
    .flatMap((part) => {
      if (typeof part !== "object" || part === null || !("type" in part) || part.type !== "text") {
        return [];
      }

      if ("content" in part && typeof part.content === "string") return [part.content];
      if ("text" in part && typeof part.text === "string") return [part.text];
      return [];
    })
    .join("");

  if (message.parts || Array.isArray(message.content)) return textFromParts;
  return typeof message.content === "string" ? message.content : "";
}

export function toAssistantModelMessages(messages: ValidatedMessage[]): ModelMessage[] {
  return messages.flatMap((message) => {
    const content = extractText(message);
    return content.trim() ? [{ role: message.role, content }] : [];
  });
}

export function requestsMedicationAdvice(text: string): boolean {
  return medicationAdvicePatterns.some((pattern) => pattern.test(text));
}
