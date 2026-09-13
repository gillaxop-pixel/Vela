import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Onboarding } from "@/components/onboarding";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useHydrated } from "@/hooks/use-hydrated";
import { useThemeSync } from "@/hooks/use-theme";
import { useVela } from "@/lib/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const ready = useHydrated();
  useThemeSync();
  const onboarded = useVela((s) => s.memory.onboarded);

  return (
    <TooltipProvider delayDuration={200}>
      {ready && onboarded ? <AppShell /> : <Onboarding />}
    </TooltipProvider>
  );
}
