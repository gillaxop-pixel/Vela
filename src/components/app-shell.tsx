import { useEffect, useState } from "react";
import {
  BookOpen,
  Brain,
  CalendarCheck,
  Camera,
  CheckSquare,
  House,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Settings,
  StickyNote,
  Timer,
} from "lucide-react";
import { dict } from "@/lib/i18n";
import { useVela } from "@/lib/store";
import type { View } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChatView } from "./views/chat-view";
import { HomeView } from "./views/home-view";
import { FocusView, HabitsView, JournalView, NotesView, TasksView } from "./views/life-views";
import { MemoryView } from "./views/memory-view";
import { SettingsView } from "./views/settings-view";
import { StudioView } from "./views/studio-view";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Sheet, SheetContent } from "./ui/sheet";
import { CommandPalette } from "./command-palette";
import { VelaMark } from "./mark";

const NAV: { id: View; icon: typeof House }[] = [
  { id: "home", icon: House },
  { id: "chat", icon: MessageSquare },
  { id: "tasks", icon: CheckSquare },
  { id: "notes", icon: StickyNote },
  { id: "habits", icon: CalendarCheck },
  { id: "journal", icon: BookOpen },
  { id: "focus", icon: Timer },
  { id: "studio", icon: Camera },
  { id: "memory", icon: Brain },
  { id: "settings", icon: Settings },
];

export function AppShell() {
  const view = useVela((s) => s.view);
  const locale = useVela((s) => s.settings.locale);
  const t = dict(locale);
  const [cmd, setCmd] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmd((v) => !v);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        useVela.getState().newChat();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      const f = useVela.getState().focus;
      if (!f.running) return;
      if (f.remaining <= 1) {
        useVela.getState().setFocus({
          running: false,
          remaining: f.minutes * 60,
          startedAt: null,
          sessions: f.sessions + 1,
        });
        return;
      }
      useVela.getState().setFocus({ remaining: f.remaining - 1 });
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex h-dvh bg-background text-foreground">
      <aside className="hidden w-[260px] shrink-0 flex-col border-r border-border md:flex">
        <Sidebar onSearch={() => setCmd(true)} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-12 items-center gap-2 px-3 md:hidden">
          <Button size="icon-sm" variant="ghost" onClick={() => setMobileNav(true)} aria-label="Menu">
            <Menu className="size-4" />
          </Button>
          <VelaMark className="size-7" />
          <span className="font-display text-lg">{t.name}</span>
          <Button size="icon-sm" variant="ghost" className="ml-auto" onClick={() => setCmd(true)} aria-label={t.cmd.placeholder}>
            <Search className="size-4" />
          </Button>
        </div>
        <main className="min-h-0 flex-1 pb-16 md:pb-0">{renderView(view)}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-border bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.slice(0, 4).map((item) => (
          <NavBtn key={item.id} id={item.id} icon={item.icon} active={view === item.id} />
        ))}
        <button
          type="button"
          onClick={() => setMobileNav(true)}
          className="flex min-w-11 flex-col items-center gap-0.5 text-[10px] text-muted-foreground"
        >
          <Menu className="size-5" />
          {t.nav.more}
        </button>
      </nav>

      <Sheet open={mobileNav} onOpenChange={setMobileNav}>
        <SheetContent side="left" className="flex flex-col p-0">
          <Sidebar
            onSearch={() => {
              setMobileNav(false);
              setCmd(true);
            }}
            onNavigate={() => setMobileNav(false)}
          />
        </SheetContent>
      </Sheet>

      <CommandPalette open={cmd} onOpenChange={setCmd} />
    </div>
  );
}

function Sidebar({ onSearch, onNavigate }: { onSearch: () => void; onNavigate?: () => void }) {
  const view = useVela((s) => s.view);
  const locale = useVela((s) => s.settings.locale);
  const conversations = useVela((s) => s.conversations);
  const activeId = useVela((s) => s.activeId);
  const t = dict(locale);
  const recents = [...conversations].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt).slice(0, 12);

  return (
    <>
      <div className="flex items-center gap-2 px-4 py-4">
        <VelaMark className="size-8" />
        <div>
          <p className="font-display text-xl leading-none">{t.name}</p>
          <p className="text-[11px] text-muted-foreground">{t.tagline}</p>
        </div>
      </div>
      <div className="px-3">
        <Button
          className="w-full justify-start"
          onClick={() => {
            useVela.getState().newChat();
            onNavigate?.();
          }}
        >
          <Plus className="size-4" />
          {t.chat.new}
        </Button>
        <button
          type="button"
          onClick={onSearch}
          className="mt-2 flex h-10 w-full items-center gap-2 rounded-md px-3 text-sm text-muted-foreground shadow-[var(--shadow-border)]"
        >
          <Search className="size-4" />
          {t.cmd.placeholder}
        </button>
      </div>
      <nav className="mt-4 px-2">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === "chat" && !useVela.getState().activeId) {
                  useVela.getState().setView("chat");
                } else if (item.id === "chat") {
                  useVela.getState().setView("chat");
                } else {
                  useVela.getState().setView(item.id);
                }
                onNavigate?.();
              }}
              className={cn(
                "flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground",
                active && "bg-muted text-foreground",
              )}
            >
              <Icon className="size-4" />
              {t.nav[item.id]}
            </button>
          );
        })}
      </nav>
      <p className="mt-5 px-5 text-[11px] tracking-wide text-muted-foreground uppercase">{t.chat.search}</p>
      <ScrollArea className="mt-1 min-h-0 flex-1 px-2 pb-4">
        {recents.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              useVela.getState().setActive(c.id);
              onNavigate?.();
            }}
            className={cn(
              "mb-0.5 flex w-full truncate rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
              c.id === activeId && view === "chat" && "bg-muted text-foreground",
            )}
          >
            {c.title || t.chat.untitled}
          </button>
        ))}
      </ScrollArea>
    </>
  );
}

function NavBtn({ id, icon: Icon, active }: { id: View; icon: typeof House; active: boolean }) {
  const locale = useVela((s) => s.settings.locale);
  const t = dict(locale);
  return (
    <button
      type="button"
      onClick={() => useVela.getState().setView(id)}
      className={cn(
        "flex min-w-11 flex-col items-center gap-0.5 text-[10px]",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      <Icon className="size-5" />
      {t.nav[id]}
    </button>
  );
}

function renderView(view: View) {
  switch (view) {
    case "home":
      return <HomeView />;
    case "chat":
      return <ChatView />;
    case "tasks":
      return <TasksView />;
    case "notes":
      return <NotesView />;
    case "habits":
      return <HabitsView />;
    case "journal":
      return <JournalView />;
    case "focus":
      return <FocusView />;
    case "studio":
      return <StudioView />;
    case "memory":
      return <MemoryView />;
    case "settings":
      return <SettingsView />;
  }
}
