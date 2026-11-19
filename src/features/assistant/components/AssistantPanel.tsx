import { fetchServerSentEvents, useChat, type UIMessage } from "@tanstack/ai-react";
import React, { useId, useMemo, useState } from "react";

import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Textarea } from "#/components/ui/textarea";

export function AssistantPanel({ patientId }: { patientId?: string }) {
  const threadId = useId();
  const inputId = useId();
  const [input, setInput] = useState("");
  const forwardedProps = useMemo(() => (patientId ? { patientId } : {}), [patientId]);
  const { messages, sendMessage, isLoading, error, stop } = useChat({
    connection: fetchServerSentEvents("/api/assistant"),
    threadId,
    forwardedProps,
  });

  const handleSubmit = (event: React.ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    void sendMessage(text);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{patientId ? "Clinical chart assistant" : "Clinic roster assistant"}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground" role="note">
          {patientId
            ? "Draft chart summaries only. It does not diagnose, recommend treatment, or calculate medication doses. Verify information and review all output as a clinician."
            : "Roster search only. No individual patient history is available until you open that patient's chart."}
        </p>

        <div aria-live="polite" className="flex flex-col gap-3">
          {messages.map((message) => (
            <AssistantMessage key={message.id} message={message} />
          ))}
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            The assistant response was interrupted. Please retry.
          </p>
        )}

        <form className="flex flex-col gap-3" noValidate onSubmit={handleSubmit}>
          <label className="text-sm font-medium" htmlFor={inputId}>
            {patientId ? "Ask about this patient’s documented chart" : "Search the clinic roster"}
          </label>
          <Textarea
            id={inputId}
            maxLength={4_000}
            onChange={(event) => setInput(event.currentTarget.value)}
            placeholder={
              patientId
                ? "Summarize recent visits or documented growth measurements"
                : "Find a patient by name or MRN"
            }
            value={input}
          />
          <div className="flex justify-end gap-2">
            {isLoading && (
              <Button onClick={stop} type="button" variant="outline">
                Stop
              </Button>
            )}
            <Button disabled={!input.trim() || isLoading} type="submit">
              Send
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function AssistantMessage({ message }: { message: UIMessage }) {
  const text = message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part.type === "text" ? part.content : ""))
    .join("");

  if (!text.trim()) return null;

  return (
    <div className="rounded-md border p-3">
      <p className="mb-1 text-xs font-medium text-muted-foreground">
        {message.role === "user" ? "You" : "Assistant"}
      </p>
      <p className="whitespace-pre-wrap text-sm">{text}</p>
    </div>
  );
}
