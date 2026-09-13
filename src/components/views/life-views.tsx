import { useMemo, useState } from "react";
import { Check, Pause, Play, Plus, Trash2 } from "lucide-react";
import { dict, localeTag } from "@/lib/i18n";
import { streak, todayKey } from "@/lib/context";
import { useVela } from "@/lib/store";
import type { Mood, Priority } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function TasksView() {
  const locale = useVela((s) => s.settings.locale);
  const t = dict(locale);
  const tasks = useVela((s) => s.tasks);
  const [draft, setDraft] = useState("");
  const open = tasks.filter((x) => !x.done);
  const done = tasks.filter((x) => x.done);

  return (
    <Pane title={t.tasks.title}>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          useVela.getState().addTask(draft);
          setDraft("");
        }}
      >
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t.tasks.placeholder} />
        <Button type="submit" size="icon" aria-label={t.tasks.add}>
          <Plus className="size-4" />
        </Button>
      </form>
      {tasks.length === 0 && <p className="mt-8 text-sm text-muted-foreground">{t.tasks.empty}</p>}
      <ul className="mt-6 space-y-2">
        {open.map((item) => (
          <TaskRow key={item.id} id={item.id} title={item.title} done={item.done} priority={item.priority} due={item.due} />
        ))}
      </ul>
      {done.length > 0 && (
        <>
          <p className="mt-8 mb-2 text-[11px] tracking-wide text-muted-foreground uppercase">{t.tasks.done}</p>
          <ul className="space-y-2">
            {done.map((item) => (
              <TaskRow key={item.id} id={item.id} title={item.title} done={item.done} priority={item.priority} due={item.due} />
            ))}
          </ul>
        </>
      )}
    </Pane>
  );
}

function TaskRow({
  id,
  title,
  done,
  priority,
  due,
}: {
  id: string;
  title: string;
  done: boolean;
  priority: Priority;
  due?: string;
}) {
  const locale = useVela((s) => s.settings.locale);
  const t = dict(locale);
  return (
    <li className="flex items-center gap-3 rounded-xl bg-card px-3 py-2.5 shadow-[var(--shadow-border)]">
      <button
        type="button"
        className={cn(
          "inline-flex size-6 items-center justify-center rounded-full",
          done ? "bg-sage text-accent-foreground" : "bg-muted",
        )}
        onClick={() => useVela.getState().patchTask(id, { done: !done })}
      >
        {done ? <Check className="size-3.5" /> : null}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm", done && "text-muted-foreground line-through")}>{title}</p>
        <div className="mt-0.5 flex gap-2 text-[11px] text-muted-foreground">
          <span>{t.priority[priority]}</span>
          {due ? <span>{due}</span> : null}
        </div>
      </div>
      <select
        value={priority}
        onChange={(e) => useVela.getState().patchTask(id, { priority: e.target.value as Priority })}
        className="h-9 rounded-md bg-transparent text-xs text-muted-foreground outline-none"
      >
        <option value="low">{t.priority.low}</option>
        <option value="normal">{t.priority.normal}</option>
        <option value="high">{t.priority.high}</option>
      </select>
      <button
        type="button"
        className="inline-flex size-9 items-center justify-center text-muted-foreground hover:text-foreground"
        onClick={() => useVela.getState().deleteTask(id)}
      >
        <Trash2 className="size-4" />
      </button>
    </li>
  );
}

export function NotesView() {
  const locale = useVela((s) => s.settings.locale);
  const t = dict(locale);
  const notes = useVela((s) => s.notes);
  const [active, setActive] = useState<string | null>(notes[0]?.id ?? null);
  const note = notes.find((n) => n.id === active) ?? notes[0];

  return (
    <div className="flex h-full min-h-0">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border md:flex">
        <div className="flex items-center justify-between px-4 py-4">
          <h2 className="font-display text-2xl">{t.notes.title}</h2>
          <Button
            size="icon-sm"
            variant="secondary"
            onClick={() => setActive(useVela.getState().addNote())}
            aria-label={t.notes.add}
          >
            <Plus className="size-4" />
          </Button>
        </div>
        <ul className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          {notes.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => setActive(n.id)}
                className={cn(
                  "mb-1 w-full rounded-lg px-3 py-2 text-left",
                  n.id === note?.id ? "bg-muted" : "hover:bg-muted/60",
                )}
              >
                <p className="truncate text-sm">{n.title || t.notes.untitled}</p>
                <p className="truncate text-[11px] text-muted-foreground">{n.body || "—"}</p>
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <div className="min-w-0 flex-1 px-5 py-6 md:px-10">
        <div className="mb-4 flex items-center justify-between md:hidden">
          <h2 className="font-display text-2xl">{t.notes.title}</h2>
          <Button size="icon-sm" onClick={() => setActive(useVela.getState().addNote())}>
            <Plus className="size-4" />
          </Button>
        </div>
        {!note ? (
          <p className="text-sm text-muted-foreground">{t.notes.empty}</p>
        ) : (
          <div className="mx-auto max-w-2xl">
            <input
              value={note.title}
              placeholder={t.notes.untitled}
              onChange={(e) => useVela.getState().patchNote(note.id, { title: e.target.value })}
              className="w-full bg-transparent font-display text-3xl outline-none placeholder:text-muted-foreground"
            />
            <Textarea
              value={note.body}
              placeholder={t.notes.placeholder}
              onChange={(e) => useVela.getState().patchNote(note.id, { body: e.target.value })}
              className="mt-4 min-h-[50vh] bg-transparent shadow-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function HabitsView() {
  const locale = useVela((s) => s.settings.locale);
  const t = dict(locale);
  const habits = useVela((s) => s.habits);
  const [draft, setDraft] = useState("");
  const day = todayKey();
  const days = useMemo(() => lastDays(7), []);

  return (
    <Pane title={t.habits.title}>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          useVela.getState().addHabit(draft);
          setDraft("");
        }}
      >
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t.habits.placeholder} />
        <Button type="submit" size="icon" aria-label={t.habits.add}>
          <Plus className="size-4" />
        </Button>
      </form>
      {habits.length === 0 && <p className="mt-8 text-sm text-muted-foreground">{t.habits.empty}</p>}
      <ul className="mt-6 space-y-3">
        {habits.map((h) => (
          <li key={h.id} className="rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{h.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {t.habits.streak} {streak(h.history)}
                </p>
              </div>
              <button type="button" className="size-9 text-muted-foreground" onClick={() => useVela.getState().deleteHabit(h.id)}>
                <Trash2 className="size-4" />
              </button>
            </div>
            <div className="mt-3 flex gap-1.5">
              {days.map((d) => {
                const on = h.history.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    title={d}
                    onClick={() => useVela.getState().toggleHabit(h.id, d)}
                    className={cn(
                      "h-9 flex-1 rounded-md",
                      on ? "bg-sage" : "bg-muted",
                      d === day && "ring-1 ring-ring/40",
                    )}
                  />
                );
              })}
            </div>
          </li>
        ))}
      </ul>
    </Pane>
  );
}

function lastDays(n: number) {
  const out: string[] = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i -= 1) {
    const x = new Date(d);
    x.setDate(d.getDate() - i);
    out.push(x.toISOString().slice(0, 10));
  }
  return out;
}

const MOODS: Mood[] = ["clear", "calm", "bright", "heavy", "tense"];

export function JournalView() {
  const locale = useVela((s) => s.settings.locale);
  const t = dict(locale);
  const day = todayKey();
  const entry = useVela((s) => s.journal.find((j) => j.date === day));
  const [mood, setMood] = useState<Mood>(entry?.mood ?? "clear");
  const [body, setBody] = useState(entry?.body ?? "");

  return (
    <Pane title={t.journal.title}>
      <p className="text-sm text-muted-foreground">
        {new Intl.DateTimeFormat(localeTag(locale), { dateStyle: "full" }).format(new Date())}
      </p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {MOODS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMood(m)}
            className={cn(
              "h-9 rounded-full px-3 text-xs font-medium",
              mood === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {t.moods[m]}
          </button>
        ))}
      </div>
      <Textarea
        className="mt-4 min-h-48"
        value={body}
        placeholder={t.journal.placeholder}
        onChange={(e) => setBody(e.target.value)}
      />
      <Button
        className="mt-4"
        onClick={() => useVela.getState().upsertJournal({ date: day, mood, body })}
      >
        {t.journal.save}
      </Button>
    </Pane>
  );
}

export function FocusView() {
  const locale = useVela((s) => s.settings.locale);
  const t = dict(locale);
  const focus = useVela((s) => s.focus);
  const remaining = focus.remaining;
  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const total = focus.minutes * 60;
  const progress = total === 0 ? 0 : 1 - remaining / total;
  const r = 88;
  const c = 2 * Math.PI * r;

  return (
    <Pane title={t.focus.title}>
      <p className="max-w-sm text-sm text-muted-foreground">{t.focus.body}</p>
      <div className="mt-10 flex flex-col items-center">
        <svg viewBox="0 0 200 200" className="size-56 -rotate-90">
          <circle cx="100" cy="100" r={r} fill="none" stroke="currentColor" className="text-muted" strokeWidth="6" />
          <circle
            cx="100"
            cy="100"
            r={r}
            fill="none"
            stroke="currentColor"
            className="text-sage"
            strokeWidth="6"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - progress)}
            strokeLinecap="round"
          />
        </svg>
        <p className="-mt-36 font-display text-6xl tabular-nums">
          {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          {focus.sessions} {t.focus.sessions}
        </p>
        <div className="mt-16 flex items-center gap-2">
          <Button variant="secondary" onClick={() => useVela.getState().setFocus({ remaining: focus.minutes * 60, running: false, startedAt: null })}>
            {t.focus.reset}
          </Button>
          <Button
            onClick={() =>
              useVela.getState().setFocus({
                running: !focus.running,
                startedAt: focus.running ? null : Date.now(),
              })
            }
          >
            {focus.running ? <Pause className="size-4" /> : <Play className="size-4" />}
            {focus.running ? t.focus.pause : t.focus.start}
          </Button>
        </div>
        <div className="mt-6 flex gap-2">
          {[15, 25, 50].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => useVela.getState().setFocus({ minutes: n, remaining: n * 60, running: false, startedAt: null })}
              className={cn(
                "h-9 rounded-full px-3 text-xs",
                focus.minutes === n ? "bg-muted text-foreground" : "text-muted-foreground",
              )}
            >
              {n} {t.focus.minutes}
            </button>
          ))}
        </div>
      </div>
    </Pane>
  );
}

function Pane({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="scrollbar-thin mx-auto h-full max-w-2xl overflow-y-auto px-5 py-8 md:px-10">
      <h1 className="font-display text-4xl">{title}</h1>
      <div className="mt-6">{children}</div>
    </div>
  );
}
