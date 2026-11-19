import "@tanstack/react-start/server-only";
import { anthropicText } from "@tanstack/ai-anthropic";
import { geminiText } from "@tanstack/ai-gemini";
import { ollamaText } from "@tanstack/ai-ollama";
import { openaiText } from "@tanstack/ai-openai";
import { z } from "zod";

const providerSchema = z.enum(["anthropic", "openai", "gemini", "ollama"]);
const providerResult = providerSchema.safeParse(process.env.ASSISTANT_PROVIDER ?? "anthropic");

if (!providerResult.success) {
  throw new Error("ASSISTANT_PROVIDER must be anthropic, openai, gemini, or ollama");
}

export const assistantProvider = providerResult.data;

const modelNames = {
  anthropic: "claude-haiku-4-5",
  openai: "gpt-4.1-mini",
  gemini: "gemini-2.5-flash",
  ollama: "llama3.2",
} as const;

export const assistantModelName = modelNames[assistantProvider];

export function createAssistantAdapter() {
  switch (assistantProvider) {
    case "anthropic":
      return anthropicText(modelNames.anthropic);
    case "openai":
      return openaiText(modelNames.openai);
    case "gemini":
      return geminiText(modelNames.gemini);
    case "ollama":
      return ollamaText(modelNames.ollama);
  }
}
