import { useEffect, useState } from "react";
import { useVela } from "@/lib/store";

export function useHydrated() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void Promise.resolve(useVela.persist.rehydrate()).finally(() => setReady(true));
  }, []);
  return ready;
}
