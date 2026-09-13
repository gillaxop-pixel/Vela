import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { dict } from "@/lib/i18n";
import { useVela } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function MemoryView() {
  const locale = useVela((s) => s.settings.locale);
  const memory = useVela((s) => s.memory);
  const t = dict(locale);
  const [fact, setFact] = useState("");

  return (
    <div className="scrollbar-thin mx-auto h-full max-w-2xl overflow-y-auto px-5 py-8 md:px-10">
      <h1 className="font-display text-4xl">{t.memory.title}</h1>
      <p className="mt-2 max-w-lg text-sm text-muted-foreground">{t.memory.body}</p>
      <label className="mt-8 block text-xs font-medium text-muted-foreground">{t.memory.name}</label>
      <Input
        className="mt-2"
        value={memory.name}
        onChange={(e) => useVela.getState().patchMemory({ name: e.target.value })}
      />
      <label className="mt-6 block text-xs font-medium text-muted-foreground">{t.memory.about}</label>
      <Textarea
        className="mt-2"
        value={memory.about}
        onChange={(e) => useVela.getState().patchMemory({ about: e.target.value })}
      />
      <label className="mt-6 block text-xs font-medium text-muted-foreground">{t.memory.facts}</label>
      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const v = fact.trim();
          if (!v) return;
          useVela.getState().patchMemory({ facts: [...memory.facts, v].slice(0, 24) });
          setFact("");
        }}
      >
        <Input value={fact} placeholder={t.memory.placeholderFact} onChange={(e) => setFact(e.target.value)} />
        <Button type="submit" size="icon" aria-label={t.memory.addFact}>
          <Plus className="size-4" />
        </Button>
      </form>
      <ul className="mt-4 space-y-2">
        {memory.facts.map((f, i) => (
          <li key={`${f}-${i}`} className="flex items-center gap-2 rounded-xl bg-card px-3 py-2 text-sm shadow-[var(--shadow-border)]">
            <span className="flex-1">{f}</span>
            <button
              type="button"
              className="size-9 text-muted-foreground"
              onClick={() =>
                useVela.getState().patchMemory({ facts: memory.facts.filter((_, idx) => idx !== i) })
              }
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
