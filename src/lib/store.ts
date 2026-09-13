import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Conversation,
  FocusState,
  HabitItem,
  JournalEntry,
  MemoryState,
  Mode,
  NoteItem,
  SettingsState,
  StudioImage,
  TaskItem,
  View,
} from "./types";
import { uid } from "./utils";

export interface VelaStore {
  view: View;
  activeId: string | null;
  settings: SettingsState;
  memory: MemoryState;
  city: string;
  conversations: Conversation[];
  tasks: TaskItem[];
  notes: NoteItem[];
  habits: HabitItem[];
  journal: JournalEntry[];
  studio: StudioImage[];
  focus: FocusState;
  setView: (view: View) => void;
  setActive: (id: string | null) => void;
  patchSettings: (patch: Partial<SettingsState>) => void;
  patchMemory: (patch: Partial<MemoryState>) => void;
  setCity: (city: string) => void;
  newChat: (seed?: { title?: string; mode?: Mode }) => string;
  updateConversation: (id: string, patch: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;
  addTask: (title: string) => void;
  patchTask: (id: string, patch: Partial<TaskItem>) => void;
  deleteTask: (id: string) => void;
  addNote: () => string;
  patchNote: (id: string, patch: Partial<NoteItem>) => void;
  deleteNote: (id: string) => void;
  addHabit: (name: string) => void;
  toggleHabit: (id: string, day: string) => void;
  deleteHabit: (id: string) => void;
  upsertJournal: (entry: Omit<JournalEntry, "id" | "updatedAt"> & { id?: string }) => void;
  addStudio: (image: StudioImage) => void;
  setFocus: (patch: Partial<FocusState>) => void;
  importAll: (data: Partial<Pick<VelaStore, "settings" | "memory" | "city" | "conversations" | "tasks" | "notes" | "habits" | "journal" | "studio">>) => void;
  resetAll: () => void;
}

const defaultSettings = (): SettingsState => ({
  locale: "es",
  theme: "dark",
  speakReplies: false,
  webSearch: false,
  reasoning: "low",
  mode: "vela",
});

const defaultMemory = (): MemoryState => ({
  name: "",
  about: "",
  facts: [],
  onboarded: false,
});

const defaultFocus = (): FocusState => ({
  minutes: 25,
  remaining: 25 * 60,
  running: false,
  startedAt: null,
  sessions: 0,
});

function empty() {
  return {
    view: "home" as View,
    activeId: null as string | null,
    settings: defaultSettings(),
    memory: defaultMemory(),
    city: "",
    conversations: [] as Conversation[],
    tasks: [] as TaskItem[],
    notes: [] as NoteItem[],
    habits: [] as HabitItem[],
    journal: [] as JournalEntry[],
    studio: [] as StudioImage[],
    focus: defaultFocus(),
  };
}

export const useVela = create<VelaStore>()(
  persist(
    (set, get) => ({
      ...empty(),
      setView: (view) => set({ view }),
      setActive: (id) => set({ activeId: id, view: "chat" }),
      patchSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),
      patchMemory: (patch) => set({ memory: { ...get().memory, ...patch } }),
      setCity: (city) => set({ city }),
      newChat: (seed) => {
        const id = uid();
        const now = Date.now();
        const conversation: Conversation = {
          id,
          title: seed?.title ?? "",
          mode: seed?.mode ?? get().settings.mode,
          createdAt: now,
          updatedAt: now,
          messages: [],
        };
        set({
          conversations: [conversation, ...get().conversations],
          activeId: id,
          view: "chat",
        });
        return id;
      },
      updateConversation: (id, patch) =>
        set({
          conversations: get().conversations.map((c) =>
            c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c,
          ),
        }),
      deleteConversation: (id) => {
        const rest = get().conversations.filter((c) => c.id !== id);
        set({
          conversations: rest,
          activeId: get().activeId === id ? (rest[0]?.id ?? null) : get().activeId,
        });
      },
      addTask: (title) => {
        const t = title.trim();
        if (!t) return;
        set({
          tasks: [
            { id: uid(), title: t, done: false, priority: "normal", createdAt: Date.now() },
            ...get().tasks,
          ],
        });
      },
      patchTask: (id, patch) =>
        set({ tasks: get().tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }),
      deleteTask: (id) => set({ tasks: get().tasks.filter((t) => t.id !== id) }),
      addNote: () => {
        const id = uid();
        set({
          notes: [{ id, title: "", body: "", updatedAt: Date.now() }, ...get().notes],
        });
        return id;
      },
      patchNote: (id, patch) =>
        set({
          notes: get().notes.map((n) =>
            n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n,
          ),
        }),
      deleteNote: (id) => set({ notes: get().notes.filter((n) => n.id !== id) }),
      addHabit: (name) => {
        const n = name.trim();
        if (!n) return;
        set({
          habits: [{ id: uid(), name: n, createdAt: Date.now(), history: [] }, ...get().habits],
        });
      },
      toggleHabit: (id, day) =>
        set({
          habits: get().habits.map((h) => {
            if (h.id !== id) return h;
            const has = h.history.includes(day);
            return {
              ...h,
              history: has ? h.history.filter((d) => d !== day) : [...h.history, day],
            };
          }),
        }),
      deleteHabit: (id) => set({ habits: get().habits.filter((h) => h.id !== id) }),
      upsertJournal: (entry) => {
        const day = entry.date;
        const existing = get().journal.find((j) => j.date === day);
        if (existing) {
          set({
            journal: get().journal.map((j) =>
              j.id === existing.id
                ? { ...j, ...entry, id: existing.id, updatedAt: Date.now() }
                : j,
            ),
          });
          return;
        }
        set({
          journal: [
            { id: uid(), date: day, mood: entry.mood, body: entry.body, updatedAt: Date.now() },
            ...get().journal,
          ],
        });
      },
      addStudio: (image) => set({ studio: [image, ...get().studio].slice(0, 24) }),
      setFocus: (patch) => set({ focus: { ...get().focus, ...patch } }),
      importAll: (data) =>
        set({
          settings: data.settings ? { ...defaultSettings(), ...data.settings } : get().settings,
          memory: data.memory ? { ...defaultMemory(), ...data.memory } : get().memory,
          city: data.city ?? get().city,
          conversations: data.conversations ?? get().conversations,
          tasks: data.tasks ?? get().tasks,
          notes: data.notes ?? get().notes,
          habits: data.habits ?? get().habits,
          journal: data.journal ?? get().journal,
          studio: data.studio ?? get().studio,
        }),
      resetAll: () => set({ ...empty(), settings: get().settings }),
    }),
    {
      name: "vela-v1",
      skipHydration: true,
      partialize: (s) => ({
        settings: s.settings,
        memory: s.memory,
        city: s.city,
        conversations: s.conversations.slice(0, 40).map((c) => ({
          ...c,
          messages: c.messages.slice(-40),
        })),
        tasks: s.tasks,
        notes: s.notes,
        habits: s.habits,
        journal: s.journal.slice(0, 60),
        studio: s.studio.slice(0, 16),
        focus: { ...s.focus, running: false, startedAt: null },
      }),
    },
  ),
);
