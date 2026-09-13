import type { ChatMessage, Locale, Mode, Reasoning } from "./types";

export interface ChatRequest {
  messages: { role: "user" | "assistant"; content: string; images?: string[] }[];
  locale: Locale;
  mode: Mode;
  reasoning: Reasoning;
  webSearch: boolean;
  memory: { name: string; about: string; facts: string[] };
  context: string;
}

export async function streamChat(
  payload: ChatRequest,
  onDelta: (chunk: { type: "delta" | "reasoning" | "error" | "done"; text?: string }) => void,
  signal?: AbortSignal,
) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  if (!res.ok || !res.body) {
    let message = `HTTP ${res.status}`;
    try {
      const j = (await res.json()) as { error?: string };
      if (j.error) message = j.error;
    } catch {
      /* ignore */
    }
    onDelta({ type: "error", text: message });
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n");
    buffer = parts.pop() ?? "";
    for (const line of parts) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const raw = trimmed.slice(5).trim();
      if (!raw) continue;
      try {
        const evt = JSON.parse(raw) as { type: "delta" | "reasoning" | "error" | "done"; text?: string };
        onDelta(evt);
        if (evt.type === "done" || evt.type === "error") return;
      } catch {
        /* skip malformed */
      }
    }
  }
  onDelta({ type: "done" });
}

export function toPayloadMessages(messages: ChatMessage[]) {
  return messages
    .filter((m) => m.content.trim() || (m.images && m.images.length))
    .slice(-16)
    .map((m) => ({
      role: m.role,
      content: m.content,
      images: m.images?.map((i) => i.url),
    }));
}
