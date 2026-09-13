import { dict } from "@/lib/i18n";
import { useVela } from "@/lib/store";
import type { Locale, Reasoning, Theme } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export function SettingsView() {
  const settings = useVela((s) => s.settings);
  const city = useVela((s) => s.city);
  const t = dict(settings.locale);

  function exportData() {
    const s = useVela.getState();
    const blob = new Blob(
      [
        JSON.stringify(
          {
            settings: s.settings,
            memory: s.memory,
            city: s.city,
            conversations: s.conversations,
            tasks: s.tasks,
            notes: s.notes,
            habits: s.habits,
            journal: s.journal,
            studio: s.studio,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "vela-data.json";
    a.click();
  }

  function importData() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      useVela.getState().importAll(JSON.parse(text));
    };
    input.click();
  }

  return (
    <div className="scrollbar-thin mx-auto h-full max-w-xl overflow-y-auto px-5 py-8 md:px-10">
      <h1 className="font-display text-4xl">{t.settings.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t.settings.data}</p>

      <Row label={t.settings.language}>
        <Seg
          value={settings.locale}
          onChange={(v) => useVela.getState().patchSettings({ locale: v })}
          options={[
            { value: "es" as Locale, label: "ES" },
            { value: "en" as Locale, label: "EN" },
          ]}
        />
      </Row>
      <Row label={t.settings.theme}>
        <Seg
          value={settings.theme}
          onChange={(v) => useVela.getState().patchSettings({ theme: v })}
          options={[
            { value: "dark" as Theme, label: t.settings.dark },
            { value: "light" as Theme, label: t.settings.light },
            { value: "system" as Theme, label: t.settings.system },
          ]}
        />
      </Row>
      <Row label={t.settings.reasoning}>
        <Seg
          value={settings.reasoning}
          onChange={(v) => useVela.getState().patchSettings({ reasoning: v })}
          options={[
            { value: "low" as Reasoning, label: t.settings.low },
            { value: "medium" as Reasoning, label: t.settings.medium },
            { value: "high" as Reasoning, label: t.settings.high },
          ]}
        />
      </Row>
      <Row label={t.settings.voice}>
        <Switch
          checked={settings.speakReplies}
          onCheckedChange={(v) => useVela.getState().patchSettings({ speakReplies: v })}
        />
      </Row>
      <Row label={t.settings.search}>
        <Switch
          checked={settings.webSearch}
          onCheckedChange={(v) => useVela.getState().patchSettings({ webSearch: v })}
        />
      </Row>
      <label className="mt-8 block text-xs font-medium text-muted-foreground">{t.settings.city}</label>
      <Input
        className="mt-2"
        value={city}
        placeholder={t.settings.cityPlaceholder}
        onChange={(e) => useVela.getState().setCity(e.target.value)}
      />

      <div className="mt-10 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={exportData}>
          {t.settings.export}
        </Button>
        <Button variant="secondary" onClick={importData}>
          {t.settings.import}
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            if (confirm(t.settings.confirmClear)) useVela.getState().resetAll();
          }}
        >
          {t.settings.clear}
        </Button>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 flex items-center justify-between gap-4">
      <p className="text-sm">{label}</p>
      {children}
    </div>
  );
}

function Seg<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex rounded-full bg-muted p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "h-8 rounded-full px-3 text-xs font-medium",
            value === o.value ? "bg-card text-foreground shadow-[var(--shadow-border)]" : "text-muted-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
