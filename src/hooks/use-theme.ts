import { useEffect } from "react";
import { useVela } from "@/lib/store";

export function useThemeSync() {
  const theme = useVela((s) => s.settings.theme);
  const locale = useVela((s) => s.settings.locale);

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const resolved =
        theme === "system"
          ? window.matchMedia("(prefers-color-scheme: light)").matches
            ? "light"
            : "dark"
          : theme;
      root.classList.remove("light", "dark");
      root.classList.add(resolved);
      root.lang = locale === "en" ? "en" : "es";
    };
    apply();
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme, locale]);
}
