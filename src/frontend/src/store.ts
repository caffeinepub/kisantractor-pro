import { create } from "zustand";
import type { Language } from "./i18n";

export interface DriverRequest {
  id: string;
  name: string;
  phone: string;
  status: "pending" | "approved" | "rejected";
  driverId?: bigint;
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem("kisan_store");
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed.driverRequests) {
      parsed.driverRequests = parsed.driverRequests.map(
        (r: DriverRequest & { driverId?: string | bigint }) => ({
          ...r,
          driverId:
            r.driverId != null ? BigInt(r.driverId.toString()) : undefined,
        }),
      );
    }
    if (parsed.loggedInDriverId != null) {
      parsed.loggedInDriverId = BigInt(parsed.loggedInDriverId.toString());
    }
    return parsed;
  } catch {
    return {};
  }
}

function saveToStorage(state: Partial<AppState>) {
  try {
    const existing = JSON.parse(localStorage.getItem("kisan_store") || "{}");
    const toSave = { ...existing, ...state };
    const serialized = JSON.stringify(toSave, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value,
    );
    localStorage.setItem("kisan_store", serialized);
  } catch {
    // ignore
  }
}

interface AppState {
  language: Language;
  darkMode: boolean;
  authRole: "owner" | "driver" | null;
  loggedInDriverId: bigint | null;
  ownerPassword: string;
  driverRequests: DriverRequest[];
  services: string[];
  serviceRates: Record<string, { perHour: number; perMinute: number }>;
  setLanguage: (lang: Language) => void;
  setDarkMode: (dark: boolean) => void;
  setAuthRole: (role: "owner" | "driver" | null) => void;
  setLoggedInDriverId: (id: bigint | null) => void;
  setOwnerPassword: (pwd: string) => void;
  addDriverRequest: (req: DriverRequest) => void;
  updateDriverRequest: (id: string, updates: Partial<DriverRequest>) => void;
  setServices: (services: string[]) => void;
  setServiceRate: (
    name: string,
    rates: { perHour: number; perMinute: number },
  ) => void;
}

const stored = loadFromStorage();

export const useAppStore = create<AppState>((set) => ({
  language: stored.language ?? "gu",
  darkMode: stored.darkMode ?? false,
  authRole: stored.authRole ?? null,
  loggedInDriverId: stored.loggedInDriverId ?? null,
  ownerPassword: stored.ownerPassword ?? "1234",
  driverRequests: stored.driverRequests ?? [],
  services: stored.services ?? [
    "Ploughing",
    "Harvesting",
    "Threshing",
    "Other",
  ],
  serviceRates: stored.serviceRates ?? {},

  setLanguage: (lang) => {
    set({ language: lang });
    saveToStorage({ language: lang });
  },
  setDarkMode: (dark) => {
    set({ darkMode: dark });
    saveToStorage({ darkMode: dark });
  },
  setAuthRole: (role) => {
    set({ authRole: role });
    saveToStorage({ authRole: role });
  },
  setLoggedInDriverId: (id) => {
    set({ loggedInDriverId: id });
    saveToStorage({ loggedInDriverId: id });
  },
  setOwnerPassword: (pwd) => {
    set({ ownerPassword: pwd });
    saveToStorage({ ownerPassword: pwd });
  },
  addDriverRequest: (req) => {
    set((state) => {
      const updated = [...state.driverRequests, req];
      saveToStorage({ driverRequests: updated });
      return { driverRequests: updated };
    });
  },
  updateDriverRequest: (id, updates) => {
    set((state) => {
      const updated = state.driverRequests.map((r) =>
        r.id === id ? { ...r, ...updates } : r,
      );
      saveToStorage({ driverRequests: updated });
      return { driverRequests: updated };
    });
  },
  setServices: (services) => {
    set({ services });
    saveToStorage({ services });
  },
  setServiceRate: (name, rates) => {
    set((state) => {
      const updated = { ...state.serviceRates, [name]: rates };
      saveToStorage({ serviceRates: updated });
      return { serviceRates: updated };
    });
  },
}));
