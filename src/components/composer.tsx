import { useEffect, useRef, useState } from "react";
import { ArrowUp, Globe, ImagePlus, Mic, Square } from "lucide-react";
import { dict, localeTag } from "@/lib/i18n";
import { MODE_ORDER } from "@/lib/modes";
import { useVela } from "@/lib/store";
import type { ChatImage, Mode } from "@/lib/types";
import { cn, fileToDataUrl } from "@/lib/utils";
import { Button } from "./ui/button";

interface ComposerProps {
  onSend: (payload: { text: string; images: ChatImage[]; webSearch: boolean }) => void;
  busy?: boolean;
  onStop?: () => void;
  autoFocus?: boolean;
  large?: boolean;
  placeholder?: string;
}

export function Composer({ onSend, busy, onStop, autoFocus, large, placeholder }: ComposerProps) {
  const locale = useVela((s) => s.settings.locale);
  const mode = useVela((s) => s.settings.mode);
  const defaultSearch = useVela((s) => s.settings.webSearch);
  const t = dict(locale);
  const [text, setText] = useState("");
  const [images, setImages] = useState<ChatImage[]>([]);
  const [web, setWeb] = useState(defaultSearch);
  const [listening, setListening] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const recRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    setWeb(defaultSearch);
  }, [defaultSearch]);

  useEffect(() => {
    if (autoFocus) area.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, large ? 200 : 160)}px`;
  }, [text, large]);

  function submit() {
    const value = text.trim();
    if ((!value && !images.length) || busy) return;
    onSend({ text: value, images, webSearch: web });
    setText("");
    setImages([]);
  }

  async function onFiles(files: FileList | null) {
    if (!files) return;
    const next: ChatImage[] = [];
    for (const file of Array.from(files).slice(0, 3)) {
      if (!file.type.startsWith("image/")) continue;
      next.push({ url: await fileToDataUrl(file) });
    }
    setImages((prev) => [...prev, ...next].slice(0, 3));
  }

  function toggleVoice() {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return;
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = localeTag(locale);
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const chunk = Array.from(e.results)
        .map((r) => r[0]?.transcript ?? "")
        .join(" ");
      setText(chunk);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  return (
    <div
      className={cn(
        "rounded-2xl bg-card p-2 shadow-[var(--shadow-border)]",
        large && "p-2.5",
      )}
    >
      {images.length > 0 && (
        <div className="mb-2 flex gap-2 px-1 pt-1">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              className="relative size-14 overflow-hidden rounded-lg"
              onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
            >
              <img src={img.url} alt="" className="size-full object-cover outline outline-1 -outline-offset-1 outline-foreground/10" />
            </button>
          ))}
        </div>
      )}
      <textarea
        ref={area}
        value={text}
        rows={1}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder ?? t.home.placeholder}
        className={cn(
          "max-h-40 w-full resize-none bg-transparent px-3 py-2 text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground",
          large && "min-h-16 text-base",
        )}
      />
      <div className="flex items-center gap-1 px-1 pb-0.5">
        <ModePills value={mode} onChange={(m) => useVela.getState().patchSettings({ mode: m })} />
        <div className="ml-auto flex items-center gap-0.5">
          <Tool
            active={web}
            label={t.chat.web}
            onClick={() => setWeb((v) => !v)}
          >
            <Globe className="size-4" />
          </Tool>
          <label className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
            <ImagePlus className="size-4" />
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              multiple
              onChange={(e) => void onFiles(e.target.files)}
            />
          </label>
          <Tool active={listening} label={listening ? t.chat.listening : t.chat.voice} onClick={toggleVoice}>
            <Mic className="size-4" />
          </Tool>
          {busy ? (
            <Button size="icon-sm" variant="secondary" onClick={onStop} aria-label={t.chat.stop}>
              <Square className="size-3.5 fill-current" />
            </Button>
          ) : (
            <Button
              size="icon-sm"
              disabled={!text.trim() && images.length === 0}
              onClick={submit}
              aria-label={t.composer.send}
            >
              <ArrowUp className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Tool({
  children,
  active,
  label,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground",
        active && "bg-muted text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function ModePills({ value, onChange }: { value: Mode; onChange: (m: Mode) => void }) {
  const locale = useVela((s) => s.settings.locale);
  const t = dict(locale);
  return (
    <div className="hidden items-center gap-0.5 sm:flex">
      {MODE_ORDER.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={cn(
            "h-8 rounded-full px-2.5 text-[11px] font-medium tracking-wide text-muted-foreground transition-colors duration-150 hover:text-foreground",
            value === m && "bg-muted text-foreground",
          )}
        >
          {t.modes[m]}
        </button>
      ))}
    </div>
  );
}

