import { useEffect, useMemo, useState } from "react";
import { Command } from "cmdk";
import { dict } from "@/lib/i18n";
import { useVela } from "@/lib/store";
import type { View } from "@/lib/types";

const VIEWS: View[] = [
  "home",
  "chat",
  "tasks",
  "notes",
  "habits",
  "journal",
  "focus",
  "studio",
  "memory",
  "settings",
];

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const locale = useVela((s) => s.settings.locale);
  const conversations = useVela((s) => s.conversations);
  const t = dict(locale);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const chats = useMemo(
    () =>
      conversations.filter((c) => {
        const hay = `${c.title} ${c.messages.map((m) => m.content).join(" ")}`.toLowerCase();
        return !q || hay.includes(q.toLowerCase());
      }).slice(0, 8),
    [conversations, q],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-background/70 px-4 pt-[12vh]">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={() => onOpenChange(false)} />
      <Command
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-border)]"
        shouldFilter={false}
      >
        <Command.Input
          value={q}
          onValueChange={setQ}
          placeholder={t.cmd.placeholder}
          className="h-12 w-full border-b border-border bg-transparent px-4 text-sm outline-none"
        />
        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-sm text-muted-foreground">{t.cmd.empty}</Command.Empty>
          <Command.Group>
            {VIEWS.map((v) => (
              <Command.Item
                key={v}
                value={t.nav[v]}
                onSelect={() => {
                  if (v === "chat") {
                    const id = useVela.getState().activeId ?? useVela.getState().conversations[0]?.id;
                    if (id) useVela.getState().setActive(id);
                    else useVela.getState().setView("chat");
                  } else {
                    useVela.getState().setView(v);
                  }
                  onOpenChange(false);
                }}
                className="flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-muted"
              >
                {t.nav[v]}
              </Command.Item>
            ))}
          </Command.Group>
          {chats.map((c) => (
            <Command.Item
              key={c.id}
              value={c.title || t.chat.untitled}
              onSelect={() => {
                useVela.getState().setActive(c.id);
                onOpenChange(false);
              }}
              className="flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm text-muted-foreground data-[selected=true]:bg-muted data-[selected=true]:text-foreground"
            >
              {c.title || t.chat.untitled}
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </div>
  );
}
