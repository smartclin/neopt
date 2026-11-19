import { chat, maxIterations, toServerSentEventsResponse, type ChatMiddleware } from "@tanstack/ai";
import { createFileRoute } from "@tanstack/react-router";

import { db, eq } from "@/db";
import { patients } from "@/db/schema";
import {
  assistantModelName,
  assistantProvider,
  createAssistantAdapter,
} from "@/features/assistant/config";
import { assistantSystemPrompt } from "@/features/assistant/prompt";
import { canUseAssistantRole, resolveAssistantClinicId } from "@/features/assistant/scope";
import { createAssistantTools } from "@/features/assistant/tools";
import {
  assistantRequestSchema,
  requestsMedicationAdvice,
  toAssistantModelMessages,
} from "@/features/assistant/validation";
import { _getUserImpl } from "@/lib/auth/functions.server";

const MAX_REQUEST_BYTES = 128 * 1024;
const REQUEST_TIMEOUT_MS = 45_000;

class AssistantRequestError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 413,
  ) {
    super(message);
  }
}

async function readJsonBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new AssistantRequestError("Request body is required", 400);

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_REQUEST_BYTES) {
      await reader.cancel();
      throw new AssistantRequestError("Request body is too large", 413);
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new AssistantRequestError("Request body must be valid JSON", 400);
    }
    throw error;
  }
}

function errorResponse(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

export const Route = createFileRoute("/api/assistant")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!request.headers.get("content-type")?.includes("application/json")) {
          return errorResponse("Content-Type must be application/json", 400);
        }

        let body: unknown;
        try {
          body = await readJsonBody(request);
        } catch (error) {
          if (error instanceof AssistantRequestError) {
            return errorResponse(error.message, error.status);
          }
          throw error;
        }

        const parsed = assistantRequestSchema.safeParse(body);
        if (!parsed.success) {
          return errorResponse("Invalid assistant request", 400);
        }

        const patientId = parsed.data.patientId ?? parsed.data.forwardedProps?.patientId;
        const modelMessages = toAssistantModelMessages(parsed.data.messages);
        const latestUserMessage = modelMessages.at(-1);
        if (
          latestUserMessage?.role === "user" &&
          typeof latestUserMessage.content === "string" &&
          requestsMedicationAdvice(latestUserMessage.content)
        ) {
          return errorResponse(
            "Medication recommendations and dose calculations must be reviewed by a licensed clinician.",
            422,
          );
        }

        const user = await _getUserImpl();
        if (!user) return errorResponse("Unauthorized", 401);
        if (!canUseAssistantRole(user.role)) return errorResponse("Forbidden", 403);

        let patientClinicId: string | null | undefined;
        if (patientId) {
          const [patient] = await db
            .select({ clinicId: patients.clinicId })
            .from(patients)
            .where(eq(patients.id, patientId))
            .limit(1);
          if (!patient?.clinicId) return errorResponse("Patient not found", 404);
          patientClinicId = patient.clinicId;
        }

        const clinicId = resolveAssistantClinicId(user.role, user.clinicId, patientClinicId);
        if (!clinicId) return errorResponse("Forbidden", 403);

        const controller = new AbortController();
        const onRequestAbort = () => controller.abort(request.signal.reason);
        request.signal.addEventListener("abort", onRequestAbort, { once: true });
        if (request.signal.aborted) onRequestAbort();

        let inputTokens = 0;
        let outputTokens = 0;
        let cleanedUp = false;
        const startedAt = Date.now();
        const cleanup = () => {
          if (cleanedUp) return;
          cleanedUp = true;
          clearTimeout(timeout);
          request.signal.removeEventListener("abort", onRequestAbort);
        };
        const timeout = setTimeout(() => {
          controller.abort(new Error("Assistant request timed out"));
        }, REQUEST_TIMEOUT_MS);

        const telemetry: ChatMiddleware = {
          name: "assistant-telemetry",
          onUsage(_context, usage) {
            inputTokens += usage.promptTokens ?? 0;
            outputTokens += usage.completionTokens ?? 0;
          },
          onAfterToolCall(context, info) {
            console.info(
              JSON.stringify({
                event: "assistant.tool",
                requestId: context.requestId,
                toolName: info.toolName,
                toolCallId: info.toolCallId,
                succeeded: info.ok,
                durationMs: info.duration,
              }),
            );
          },
          onFinish(context, info) {
            cleanup();
            console.info(
              JSON.stringify({
                event: "assistant.completed",
                requestId: context.requestId,
                provider: assistantProvider,
                model: assistantModelName,
                durationMs: info.duration,
                inputTokens,
                outputTokens,
                finishReason: info.finishReason,
              }),
            );
          },
          onAbort(context, info) {
            cleanup();
            console.warn(
              JSON.stringify({
                event: "assistant.aborted",
                requestId: context.requestId,
                provider: assistantProvider,
                model: assistantModelName,
                durationMs: info.duration,
              }),
            );
          },
          onError(context, info) {
            cleanup();
            console.error(
              JSON.stringify({
                event: "assistant.failed",
                requestId: context.requestId,
                provider: assistantProvider,
                model: assistantModelName,
                durationMs: Date.now() - startedAt,
                errorType: info.error instanceof Error ? info.error.name : "UnknownError",
              }),
            );
          },
        };

        const stream = chat({
          adapter: createAssistantAdapter(),
          systemPrompts: [assistantSystemPrompt()],
          messages: modelMessages,
          tools: createAssistantTools(clinicId, patientId),
          threadId: parsed.data.threadId ?? `assistant:${crypto.randomUUID()}`,
          ...(parsed.data.runId ? { runId: parsed.data.runId } : {}),
          agentLoopStrategy: maxIterations(4),
          middleware: [telemetry],
          abortController: controller,
        });

        return toServerSentEventsResponse(stream, { abortController: controller });
      },
    },
  },
});
