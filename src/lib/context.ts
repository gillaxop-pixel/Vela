import type { VelaStore } from "./store";

export function localContext(s: Pick<VelaStore, "tasks" | "habits" | "journal" | "notes" | "focus">) {
  const open = s.tasks.filter((t) => !t.done).slice(0, 8);
  const today = new Date().toISOString().slice(0, 10);
  const habitsToday = s.habits.map((h) => ({
    name: h.name,
    done: h.history.includes(today),
    streak: streak(h.history),
  }));
  const latestJournal = s.journal[0];
  const notes = s.notes.slice(0, 4).map((n) => n.title || n.body.slice(0, 40));
  return JSON.stringify(
    {
      openTasks: open.map((t) => ({ title: t.title, due: t.due, priority: t.priority })),
      habits: habitsToday,
      lastJournal: latestJournal
        ? { date: latestJournal.date, mood: latestJournal.mood }
        : null,
      recentNotes: notes,
      focusMinutes: s.focus.minutes,
    },
    null,
    0,
  );
}

export function streak(history: string[]) {
  const set = new Set(history);
  let n = 0;
  const d = new Date();
  for (;;) {
    const key = d.toISOString().slice(0, 10);
    if (!set.has(key)) break;
    n += 1;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function titleFromPrompt(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  return clean.length > 42 ? `${clean.slice(0, 42)}…` : clean;
}
