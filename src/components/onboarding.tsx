import { useState } from "react";
import { dict } from "@/lib/i18n";
import { useVela } from "@/lib/store";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { VelaMark } from "./mark";

export function Onboarding() {
  const locale = useVela((s) => s.settings.locale);
  const t = dict(locale);
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");

  function finish(skip = false) {
    useVela.getState().patchMemory({
      onboarded: true,
      name: skip ? useVela.getState().memory.name : name.trim(),
      about: skip ? useVela.getState().memory.about : about.trim(),
    });
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-10">
      <div className="vela-stagger w-full max-w-lg">
        <VelaMark className="size-12" />
        <p className="mt-8 text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
          {t.onboarding.kicker}
        </p>
        <h1 className="mt-3 font-display text-5xl md:text-6xl">{t.onboarding.title}</h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">{t.onboarding.body}</p>
        <label className="mt-8 block text-xs font-medium text-muted-foreground">{t.onboarding.name}</label>
        <Input
          className="mt-2"
          value={name}
          placeholder={t.onboarding.namePh}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <label className="mt-5 block text-xs font-medium text-muted-foreground">{t.onboarding.about}</label>
        <Textarea
          className="mt-2"
          value={about}
          placeholder={t.onboarding.aboutPh}
          onChange={(e) => setAbout(e.target.value)}
        />
        <div className="mt-6 flex items-center gap-3">
          <Button onClick={() => finish(false)}>{t.onboarding.continue}</Button>
          <Button variant="ghost" onClick={() => finish(true)}>
            {t.onboarding.skip}
          </Button>
        </div>
      </div>
    </div>
  );
}
