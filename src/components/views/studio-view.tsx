import { useState } from "react";
import { toast } from "sonner";
import { dict } from "@/lib/i18n";
import { useVela } from "@/lib/store";
import { uid } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function StudioView() {
  const locale = useVela((s) => s.settings.locale);
  const t = dict(locale);
  const images = useVela((s) => s.studio);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);

  async function generate() {
    const p = prompt.trim();
    if (p.length < 3 || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/imagine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p }),
      });
      const json = (await res.json()) as { ok?: boolean; url?: string; error?: string };
      if (!json.ok || !json.url) throw new Error(json.error || t.studio.error);
      useVela.getState().addStudio({ id: uid(), prompt: p, url: json.url, createdAt: Date.now() });
      setPrompt("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.studio.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="scrollbar-thin mx-auto h-full max-w-4xl overflow-y-auto px-5 py-8 md:px-10">
      <h1 className="font-display text-4xl">{t.studio.title}</h1>
      <div className="mt-6 rounded-2xl bg-card p-3 shadow-[var(--shadow-border)]">
        <Textarea
          value={prompt}
          placeholder={t.studio.placeholder}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-24 bg-transparent shadow-none"
        />
        <div className="flex justify-end px-1 pb-1">
          <Button onClick={() => void generate()} disabled={busy || prompt.trim().length < 3}>
            {busy ? t.studio.working : t.studio.generate}
          </Button>
        </div>
      </div>
      {images.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">{t.studio.empty}</p>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {images.map((img) => (
            <li key={img.id} className="overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-border)]">
              <img
                src={img.url}
                alt={img.prompt}
                className="aspect-[4/3] w-full object-cover outline outline-1 -outline-offset-1 outline-foreground/10"
              />
              <p className="px-4 py-3 text-sm text-muted-foreground">{img.prompt}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
