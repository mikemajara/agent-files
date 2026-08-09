"use client";

import { useEveAgent, type EveMessage } from "eve/react";
import { useEffect, useRef, useState } from "react";

type CompanionPanelProps = {
  open: boolean;
  onClose: () => void;
};

function textFromMessage(message: EveMessage): string {
  return message.parts
    .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("");
}

function toolNames(message: EveMessage): string[] {
  const names: string[] = [];
  for (const part of message.parts) {
    if (
      typeof part === "object" &&
      part &&
      "toolName" in part &&
      typeof (part as { toolName?: unknown }).toolName === "string"
    ) {
      names.push((part as { toolName: string }).toolName);
    }
  }
  return names;
}

export function CompanionPanel({ open, onClose }: CompanionPanelProps) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const agent = useEveAgent();
  const isBusy = agent.status === "submitted" || agent.status === "streaming";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agent.data.messages, agent.status]);

  if (!open) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || isBusy) return;
    setDraft("");
    await agent.send({ message: text });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/25 backdrop-blur-[1px]">
      <button
        type="button"
        aria-label="Close companion backdrop"
        className="flex-1"
        onClick={onClose}
      />
      <aside className="flex h-full w-full max-w-md flex-col border-l border-line bg-panel shadow-xl">
        <header className="flex items-center gap-2 border-b border-line px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="font-medium">Agent Files companion</p>
            <p className="truncate text-xs text-muted">
              DuckDB tools · status: {agent.status}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              agent.reset();
            }}
            className="rounded-md px-2 py-1 text-xs text-muted ring-1 ring-line hover:bg-chip"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-xs text-muted ring-1 ring-line hover:bg-chip"
          >
            Close
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {agent.data.messages.length === 0 ? (
            <p className="text-sm leading-relaxed text-muted">
              Ask about your notes, run SQL, or append a note. I discover tables
              via the catalog, then query with DuckDB — I won&apos;t invent data.
            </p>
          ) : null}

          {agent.data.messages.map((message) => {
            const tools = toolNames(message);
            const text = textFromMessage(message);
            return (
              <div
                key={message.id}
                className={`rounded-lg px-3 py-2 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "ml-8 bg-accent text-white"
                    : "mr-4 bg-chip text-foreground"
                }`}
              >
                {tools.length > 0 ? (
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-wide opacity-70">
                    tools: {tools.join(", ")}
                  </p>
                ) : null}
                <p className="whitespace-pre-wrap">{text || "…"}</p>
              </div>
            );
          })}

          {agent.error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-danger ring-1 ring-red-200">
              {agent.error.message}
            </p>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={onSubmit}
          className="border-t border-line p-3"
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder="What tags appear most? Or: add a note about the launch checklist…"
            className="w-full resize-none rounded-md border border-line bg-background px-3 py-2 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void onSubmit(e);
              }
            }}
          />
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={isBusy || !draft.trim()}
              className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {isBusy ? "Thinking…" : "Send"}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
