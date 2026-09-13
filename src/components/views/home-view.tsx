import { useEffect, useState } from "react";
import { Check, Circle } from "lucide-react";
import { Composer } from "@/components/composer";
import { dict, greetingKey, localeTag } from "@/lib/i18n";
import { streak, todayKey } from "@/lib/context";
import { useVela } from "@/lib/store";
import { fetchWeather, geocodeCity, weatherLabel, type WeatherNow } from "@/lib/weather";
import { formatClock, formatDay } from "@/lib/utils";
import { useChat } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";

export function HomeView() {
  const locale = useVela((s) => s.settings.locale);
  const name = useVela((s) => s.memory.name);
  const city = useVela((s) => s.city);
  const tasksAll = useVela((s) => s.tasks);
  const habitsAll = useVela((s) => s.habits);
  const t = dict(locale);
  const { send, busy } = useChat();
  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState<WeatherNow | null>(null);
  const [wStatus, setWStatus] = useState<"idle" | "loading" | "denied">("loading");
  const tasks = tasksAll.filter((item) => !item.done).slice(0, 4);
  const habits = habitsAll.slice(0, 4);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setWStatus("loading");
      try {
        if (city.trim()) {
          const geo = await geocodeCity(city.trim());
          if (!geo) throw new Error("city");
          const w = await fetchWeather(geo.lat, geo.lon, geo.label);
          if (!cancelled) {
            setWeather(w);
            setWStatus("idle");
          }
          return;
        }
        await new Promise<void>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error("geo"));
            return;
          }
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              try {
                const w = await fetchWeather(pos.coords.latitude, pos.coords.longitude, "");
                if (!cancelled) {
                  setWeather(w);
                  setWStatus("idle");
                }
                resolve();
              } catch (e) {
                reject(e);
              }
            },
            () => reject(new Error("denied")),
            { timeout: 6000 },
          );
        });
      } catch {
        if (!cancelled) setWStatus("denied");
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [city]);

  function startChat(text: string) {
    const id = useVela.getState().newChat({ title: text.slice(0, 42) });
    void send({ conversationId: id, text });
  }

  const greet = t.greet[greetingKey(now)];
  const day = todayKey();

  return (
    <div className="scrollbar-thin mx-auto flex h-full max-w-3xl flex-col overflow-y-auto px-5 py-8 md:px-10 md:py-12">
      <div className="vela-stagger">
        <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
          {formatDay(now, localeTag(locale))}
        </p>
        <h1 className="mt-3 font-display text-[clamp(2.4rem,7vw,4.2rem)] leading-[0.95]">
          {greet}
          {name ? `, ${name}` : ""}.
        </h1>
        <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="font-mono tabular-nums text-foreground">{formatClock(now, localeTag(locale))}</span>
          {wStatus === "loading" && <span>{t.home.weatherLoading}</span>}
          {wStatus === "denied" && <span>{t.home.weatherDenied}</span>}
          {weather && (
            <span>
              {weather.temp}° · {weatherLabel(weather.code, locale)}
              {weather.city ? ` · ${weather.city}` : ""}
            </span>
          )}
        </div>
      </div>

      <div className="mt-10">
        <Composer
          large
          autoFocus
          busy={busy}
          onSend={({ text, images, webSearch }) => {
            const id = useVela.getState().newChat();
            void send({ conversationId: id, text, images, webSearch });
          }}
        />
        <div className="mt-4 flex flex-col gap-2">
          {t.home.suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => startChat(s)}
              className="rounded-xl px-3 py-2.5 text-left text-sm text-muted-foreground shadow-[var(--shadow-border)] transition-colors duration-150 hover:bg-card hover:text-foreground"
            >
              {s}
            </button>
          ))}
          <Button variant="ghost" className="justify-start text-muted-foreground" onClick={() => startChat(t.home.briefing)}>
            {t.home.briefing}
          </Button>
        </div>
      </div>

      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium">{t.tasks.title}</h2>
            <button type="button" className="text-xs text-muted-foreground" onClick={() => useVela.getState().setView("tasks")}>
              {t.nav.tasks}
            </button>
          </div>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.home.emptyTasks}</p>
          ) : (
            <ul className="space-y-2">
              {tasks.map((item) => (
                <li key={item.id} className="flex items-start gap-2 text-sm">
                  <Circle className="mt-0.5 size-3.5 text-muted-foreground" />
                  <span>{item.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium">{t.habits.title}</h2>
            <button type="button" className="text-xs text-muted-foreground" onClick={() => useVela.getState().setView("habits")}>
              {t.nav.habits}
            </button>
          </div>
          {habits.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.home.emptyHabits}</p>
          ) : (
            <ul className="space-y-2">
              {habits.map((h) => {
                const done = h.history.includes(day);
                return (
                  <li key={h.id} className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      className="flex items-center gap-2"
                      onClick={() => useVela.getState().toggleHabit(h.id, day)}
                    >
                      <span className="inline-flex size-5 items-center justify-center rounded-full bg-muted">
                        {done ? <Check className="size-3" /> : null}
                      </span>
                      {h.name}
                    </button>
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">{streak(h.history)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
