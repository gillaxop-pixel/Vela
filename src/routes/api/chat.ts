import { createFileRoute } from "@tanstack/react-router";
import { MODE_PROMPT } from "@/lib/modes";
import type { Locale, Mode, Reasoning } from "@/lib/types";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
          return Response.json({ error: "AI is not available (missing GROQ_API_KEY)" }, { status: 503 });
        }

        let body: {
          messages?: { role: "user" | "assistant"; content?: string; images?: string[] }[];
          locale?: Locale;
          mode?: Mode;
          reasoning?: Reasoning;
          webSearch?: boolean;
          memory?: { name?: string; about?: string; facts?: string[] };
          context?: string;
        };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const messages = (body.messages ?? []).slice(-16);
        if (!messages.length) {
          return Response.json({ error: "Empty conversation" }, { status: 400 });
        }

        const locale: Locale = body.locale === "en" ? "en" : "es";
        const mode: Mode = body.mode && MODE_PROMPT[body.mode] ? body.mode : "vela";
        const reasoning: Reasoning =
          body.reasoning === "medium" || body.reasoning === "high" ? body.reasoning : "low";
        const mem = body.memory ?? {};
        const facts = (mem.facts ?? []).filter(Boolean).slice(0, 12);

        const languageLine =
          locale === "es"
            ? "Responde siempre en español, salvo que el usuario escriba en otro idioma o pida lo contrario."
            : "Reply in English unless the user writes in another language or asks otherwise.";

        const identity = [
          mem.name ? `The user's name is ${mem.name}.` : "",
          mem.about ? `About the user: ${mem.about}` : "",
          facts.length ? `Remembered facts:\n- ${facts.join("\n- ")}` : "",
        ]
          .filter(Boolean)
          .join("\n");

        const system = [
          "You are Vela, a private personal AI. You are helpful, honest, clear and a bit witty when it fits. Never corporate or sycophantic.",
          "Voice: clear, specific, alive. Prefer the answer first; add depth that earns its place. If you don't know, say so.",
          "Use markdown when useful. For code, always specify a language. Keep lists tight.",
          languageLine,
          MODE_PROMPT[mode],
          identity,
          body.context ? `Local context from the user's device:\n${body.context}` : "",
          `Today: ${new Date().toISOString()}`,
        ]
          .filter(Boolean)
          .join("\n\n");

        // Groq free models: keep messages as plain text (no vision for reliability on free tier)
        const apiMessages: { role: string; content: string }[] = [
          { role: "system", content: system },
        ];

        for (const m of messages) {
          const text = (m.content ?? "").slice(0, 12000);
          apiMessages.push({ role: m.role, content: text || " " });
        }

        const payload = {
          model: "openai/gpt-oss-20b",
          messages: apiMessages,
          stream: true,
          max_tokens: reasoning === "high" ? 4096 : reasoning === "medium" ? 2048 : 1024,
          temperature: 0.7,
        };

        const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(payload),
        });

        if (!upstream.ok || !upstream.body) {
          const errText = await upstream.text().catch(() => "");
          let message = `Groq API error ${upstream.status}`;
          try {
            const parsed = JSON.parse(errText) as { error?: { message?: string } | string };
            if (typeof parsed.error === "string") message = parsed.error;
            else if (parsed.error?.message) message = parsed.error.message;
          } catch {
            /* keep default */
          }
          return Response.json({ error: message }, { status: 502 });
        }

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            const send = (obj: unknown) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
            };
            const reader = upstream.body!.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";
                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed.startsWith("data:")) continue;
                  const data = trimmed.slice(5).trim();
                  if (!data || data === "[DONE]") continue;
                  try {
                    const json = JSON.parse(data) as {
                      choices?: {
                        delta?: { content?: string };
                      }[];
                    };
                    const delta = json.choices?.[0]?.delta;
                    if (delta?.content) {
                      send({ type: "delta", text: delta.content });
                    }
                  } catch {
                    /* skip */
                  }
                }
              }
              send({ type: "done" });
            } catch (err) {
              send({
                type: "error",
                text: err instanceof Error ? err.message : "Stream failed",
              });
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
          },
        });
      },
    },
  },
});
