import { useEffect, useRef } from "react";
import { useAppStore } from "../store";
import { useActor } from "./useActor";

export function useSettingsSync() {
  const { actor, isFetching } = useActor();
  const store = useAppStore();
  const {
    language,
    darkMode,
    ownerPassword,
    services,
    serviceRates,
    setLanguage,
    setDarkMode,
    setOwnerPassword,
    setServices,
    setServiceRate,
  } = store;

  const loadedRef = useRef(false);
  const blockSaveRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // Load from backend on first connection
  useEffect(() => {
    if (!actor || isFetching || loadedRef.current) return;
    loadedRef.current = true;
    blockSaveRef.current = true;

    (async () => {
      try {
        const s = await (actor as any).getSettings();
        if (s.language) setLanguage(s.language as "en" | "gu");
        setDarkMode(s.darkMode);
        if (s.ownerPassword) setOwnerPassword(s.ownerPassword);
        if (s.services && s.services.length > 0) setServices(s.services);
        if (s.serviceRates) {
          try {
            const rates = JSON.parse(s.serviceRates);
            for (const [name, rate] of Object.entries(rates)) {
              setServiceRate(
                name,
                rate as { perHour: number; perMinute: number },
              );
            }
          } catch {
            // ignore parse error
          }
        }
      } catch (e) {
        console.error("Failed to load settings from backend", e);
      } finally {
        setTimeout(() => {
          blockSaveRef.current = false;
        }, 1500);
      }
    })();
  }, [
    actor,
    isFetching,
    setLanguage,
    setDarkMode,
    setOwnerPassword,
    setServices,
    setServiceRate,
  ]);

  // Save to backend on changes (debounced)
  useEffect(() => {
    if (!actor || !loadedRef.current || blockSaveRef.current) return;

    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      if (blockSaveRef.current) return;
      try {
        await (actor as any).updateSettings({
          hourlyRate: 0,
          acreRate: 0,
          language,
          darkMode,
          ownerPassword,
          services,
          serviceRates: JSON.stringify(serviceRates),
        });
      } catch (e) {
        console.error("Settings sync failed:", e);
      }
    }, 800);

    return () => clearTimeout(saveTimerRef.current);
  }, [actor, language, darkMode, ownerPassword, services, serviceRates]);
}
