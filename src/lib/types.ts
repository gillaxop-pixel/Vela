export type Locale = "es" | "en";
export type Theme = "dark" | "light" | "system";
export type View =
  | "home"
  | "chat"
  | "tasks"
  | "notes"
  | "habits"
  | "journal"
  | "focus"
  | "studio"
  | "memory"
  | "settings";
export type Mode = "vela" | "precise" | "muse" | "forge" | "coach";
export type Reasoning = "low" | "medium" | "high";
export type Priority = "low" | "normal" | "high";
export type Mood = "clear" | "calm" | "bright" | "heavy" | "tense";

export type ChatRole = "user" | "assistant";

export interface ChatImage {
  url: string;
  alt?: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  images?: ChatImage[];
  error?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  mode: Mode;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  archived?: boolean;
  messages: ChatMessage[];
}

export interface TaskItem {
  id: string;
  title: string;
  done: boolean;
  due?: string;
  priority: Priority;
  createdAt: number;
}

export interface NoteItem {
  id: string;
  title: string;
  body: string;
  updatedAt: number;
  pinned?: boolean;
}

export interface HabitItem {
  id: string;
  name: string;
  createdAt: number;
  history: string[];
}

export interface JournalEntry {
  id: string;
  date: string;
  mood: Mood;
  body: string;
  updatedAt: number;
}

export interface StudioImage {
  id: string;
  prompt: string;
  url: string;
  createdAt: number;
}

export interface MemoryState {
  name: string;
  about: string;
  facts: string[];
  onboarded: boolean;
}

export interface SettingsState {
  locale: Locale;
  theme: Theme;
  speakReplies: boolean;
  webSearch: boolean;
  reasoning: Reasoning;
  mode: Mode;
}

export interface FocusState {
  minutes: number;
  remaining: number;
  running: boolean;
  startedAt: number | null;
  sessions: number;
}
