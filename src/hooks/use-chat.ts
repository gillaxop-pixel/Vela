import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { streamChat, toPayloadMessages } from "@/lib/chat-client";
import { localContext, titleFromPrompt } from "@/lib/context";
import { dict } from "@/lib/i18n";
import { useVela } from "@/lib/store";
import type { ChatImage, ChatMessage } from "@/lib/types";
import { stripMarkdown, uid } from "@/lib/utils";

export function useChat() {
  const [busy, setBusy] = useState(false);
  const [reasoning, setReasoning] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(async (opts: {
    conversationId: string;
    text: string;
    images?: ChatImage[];
    webSearch?: boolean;
  }) => {
    const store = useVela.getState();
    const t = dict(store.settings.locale);
    const conv = store.conversations.find((c) => c.id === opts.conversationId);
    if (!conv) return;

    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: opts.text.trim(),
      createdAt: Date.now(),
      images: opts.images,
    };
    const assistantId = uid();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: Date.now(),
    };
    const nextMessages = [...conv.messages, userMsg, assistantMsg];
    store.updateConversation(opts.conversationId, {
      messages: nextMessages,
      title: conv.title || titleFromPrompt(opts.text),
    });

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setBusy(true);
    setReasoning("");

    let acc = "";
    try {
      await streamChat(
        {
          messages: toPayloadMessages([...conv.messages, userMsg]),
          locale: store.settings.locale,
          mode: conv.mode || store.settings.mode,
          reasoning: store.settings.reasoning,
          webSearch: opts.webSearch ?? store.settings.webSearch,
          memory: {
            name: store.memory.name,
            about: store.memory.about,
            facts: store.memory.facts,
          },
          context: localContext(store),
        },
        (evt) => {
          if (evt.type === "reasoning" && evt.text) {
            setReasoning((r) => (r + evt.text).slice(-400));
          }
          if (evt.type === "delta" && evt.text) {
            acc += evt.text;
            const current = useVela.getState().conversations.find((c) => c.id === opts.conversationId);
            if (!current) return;
            useVela.getState().updateConversation(opts.conversationId, {
              messages: current.messages.map((m) =>
                m.id === assistantId ? { ...m, content: acc } : m,
              ),
            });
          }
          if (evt.type === "error") {
            const current = useVela.getState().conversations.find((c) => c.id === opts.conversationId);
            if (!current) return;
            useVela.getState().updateConversation(opts.conversationId, {
              messages: current.messages.map((m) =>
                m.id === assistantId
                  ? { ...m, content: acc || (evt.text ?? t.chat.error), error: true }
                  : m,
              ),
            });
          }
        },
        ac.signal,
      );

      if (store.settings.speakReplies && acc && "speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(stripMarkdown(acc).slice(0, 500));
        u.lang = store.settings.locale === "es" ? "es-ES" : "en-US";
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      }
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") return;
      toast.error(t.chat.error);
      const current = useVela.getState().conversations.find((c) => c.id === opts.conversationId);
      if (!current) return;
      useVela.getState().updateConversation(opts.conversationId, {
        messages: current.messages.map((m) =>
          m.id === assistantId ? { ...m, content: acc || t.chat.error, error: true } : m,
        ),
      });
    } finally {
      setBusy(false);
      setReasoning("");
      abortRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setBusy(false);
  }, []);

  return { send, stop, busy, reasoning };
}
