import { useEffect, useRef } from "react";
import { Copy, MoreHorizontal, Pin, Trash2, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Composer } from "@/components/composer";
import { Markdown } from "@/lib/markdown";
import { dict, localeTag } from "@/lib/i18n";
import { useVela } from "@/lib/store";
import { cn, stripMarkdown } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChat } from "@/hooks/use-chat";

export function ChatView() {
  const locale = useVela((s) => s.settings.locale);
  const t = dict(locale);
  const activeId = useVela((s) => s.activeId);
  const conv = useVela((s) => s.conversations.find((c) => c.id === s.activeId));
  const { send, stop, busy, reasoning } = useChat();
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [conv?.messages, reasoning]);

  if (!conv || !activeId) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-4xl">{t.chat.emptyTitle}</p>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">{t.chat.emptyBody}</p>
        <div className="mt-8 w-full max-w-xl">
          <Composer
            large
            autoFocus
            onSend={({ text, images, webSearch }) => {
              const id = useVela.getState().newChat();
              void send({ conversationId: id, text, images, webSearch });
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 px-4 md:px-8">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{conv.title || t.chat.untitled}</p>
          <p className="text-[11px] text-muted-foreground">{t.modes[conv.mode]}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon-sm" variant="ghost" aria-label="More">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() =>
                useVela.getState().updateConversation(conv.id, { pinned: !conv.pinned })
              }
            >
              <Pin className="size-4" />
              {conv.pinned ? t.chat.unpin : t.chat.pin}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                if (confirm(t.chat.confirmDelete)) useVela.getState().deleteConversation(conv.id);
              }}
            >
              <Trash2 className="size-4" />
              {t.chat.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div ref={scroller} className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-2xl flex-col gap-6">
          {conv.messages.length === 0 && (
            <div className="py-16 text-center">
              <p className="font-display text-3xl">{t.chat.emptyTitle}</p>
              <p className="mt-2 text-sm text-muted-foreground">{t.chat.emptyBody}</p>
            </div>
          )}
          {conv.messages.map((m) => (
            <article key={m.id} className={cn("group", m.role === "user" && "ml-auto w-fit max-w-[92%]")}>
              {m.role === "user" ? (
                <div className="rounded-2xl rounded-br-md bg-secondary px-4 py-2.5 text-[15px] leading-relaxed">
                  {m.images?.length ? (
                    <div className="mb-2 flex gap-2">
                      {m.images.map((img) => (
                        <img
                          key={img.url}
                          src={img.url}
                          alt=""
                          className="h-24 rounded-lg object-cover outline outline-1 -outline-offset-1 outline-foreground/10"
                        />
                      ))}
                    </div>
                  ) : null}
                  {m.content}
                </div>
              ) : (
                <div>
                  {!m.content && busy ? (
                    <p className="vela-shimmer text-sm">{reasoning ? reasoning.slice(-80) : t.chat.thinking}</p>
                  ) : (
                    <Markdown text={m.content} className={m.error ? "text-destructive" : undefined} />
                  )}
                  {m.content ? (
                    <div className="mt-1 flex gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
                      <IconBtn
                        label={t.chat.copy}
                        onClick={() => {
                          void navigator.clipboard.writeText(m.content);
                          toast.success(t.chat.copied);
                        }}
                      >
                        <Copy className="size-3.5" />
                      </IconBtn>
                      <IconBtn
                        label={t.chat.speak}
                        onClick={() => {
                          if (!("speechSynthesis" in window)) return;
                          const u = new SpeechSynthesisUtterance(stripMarkdown(m.content).slice(0, 800));
                          u.lang = localeTag(locale);
                          window.speechSynthesis.cancel();
                          window.speechSynthesis.speak(u);
                        }}
                      >
                        <Volume2 className="size-3.5" />
                      </IconBtn>
                    </div>
                  ) : null}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>

      <div className="shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-8">
        <div className="mx-auto max-w-2xl">
          <Composer
            autoFocus
            busy={busy}
            onStop={stop}
            onSend={({ text, images, webSearch }) =>
              void send({ conversationId: conv.id, text, images, webSearch })
            }
          />
          <p className="mt-2 hidden text-center text-[11px] text-muted-foreground sm:block">
            {t.composer.hint}
          </p>
        </div>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}
