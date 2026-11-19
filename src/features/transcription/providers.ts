// src/features/transcription/providers.ts
import "@tanstack/react-start/server-only";
import { generateTranscription, type AnyTranscriptionAdapter } from "@tanstack/ai";
import { openaiTranscription } from "@tanstack/ai-openai";

export type Language = "es" | "ar" | "en" | "auto";

// Updated provider IDs for local/OpenAI stack
export type ProviderId = "gpt-4o-mini" | "whisper-local";

export type TranscriberResult = {
  text: string;
  provider: ProviderId;
  costUsd: number;
  latencyMs: number;
};

const RATES_PER_MINUTE: Record<ProviderId, number> = {
  "gpt-4o-mini": 0.003,
  // If running local whisper, cost is 0. If using OpenAI whisper-1, it's $0.006/min.
  "whisper-local": 0.0,
};

const TRANSCRIBE_TIMEOUT_MS = 60_000;

function adapterFor(provider: ProviderId): AnyTranscriptionAdapter {
  switch (provider) {
    case "gpt-4o-mini":
      return openaiTranscription("gpt-4o-mini-transcribe");
    case "whisper-local":
      // Uses OpenAI's official whisper model adapter (pointing to local endpoint if configured
      // via OPENAI_BASE_URL, or standard OpenAI API if developing online)
      return openaiTranscription("whisper-1");
  }
}

// Map our language hint to what providers accept. "auto" = let provider detect
// (critical for Arabic/English code-switching); OpenAI accepts an ISO hint but
// detection still works with it omitted, so we omit for "auto".
function languageHint(language: Language): string | undefined {
  return language === "auto" ? undefined : language;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`transcription timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

async function runProvider(
  provider: ProviderId,
  audio: File,
  seconds: number,
  language: Language,
): Promise<TranscriberResult> {
  const started = Date.now();
  const result = await withTimeout(
    generateTranscription({
      adapter: adapterFor(provider),
      threadId: `transcribe-${audio.name}-${crypto.randomUUID()}`,
      audio,
      language: languageHint(language) as never,
    }),
    TRANSCRIBE_TIMEOUT_MS,
  );
  return {
    text: result.text,
    provider,
    costUsd: (RATES_PER_MINUTE[provider] * seconds) / 60,
    latencyMs: Date.now() - started,
  };
}

/**
 * Primary → fallback. Fallback only fires on *retryable* errors
 * (timeout, 429, 5xx, network). Auth/validation/unsupported-format errors
 * surface immediately — retrying those on another provider won't help.
 */
export async function transcribeWithFallback(
  audio: File,
  seconds: number,
  language: Language,
): Promise<TranscriberResult> {
  const chain: ProviderId[] = ["gpt-4o-mini", "whisper-local"];
  let lastError: unknown;
  for (const provider of chain) {
    try {
      return await runProvider(provider, audio, seconds, language);
    } catch (err) {
      lastError = err;
      if (!isRetryable(err)) throw err;
    }
  }
  throw lastError ?? new Error("All transcription providers failed");
}

function isRetryable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return /timeout|timed out|429|rate limit|5\d\d|network|econnreset|fetch failed/.test(msg);
}
