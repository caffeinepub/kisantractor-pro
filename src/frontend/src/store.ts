import { create } from "zustand";
import type { Language } from "./i18n";

export interface DriverRequest {
  id: string;
  name: string;
  phone: string;
  status: "pending" | "approved" | "rejected";
  driverId?: bigint;
}

export interface OwnerAccount {
  password: string;
  name: string;
  securityQuestion: string;
  securityAnswer: string;
  createdAt: number;
}

function getAccounts(): Record<string, OwnerAccount> {
  try {
    return JSON.parse(localStorage.getItem("kisan_accounts") || "{}");
  } catch {
    return {};
  }
}

function saveAccounts(accounts: Record<string, OwnerAccount>) {
  try {
    localStorage.setItem("kisan_accounts", JSON.stringify(accounts));
  } catch {
    // ignore
  }
}

export function registerOwner(
  mobile: string,
  password: string,
  name: string,
  securityQuestion: string,
  securityAnswer: string,
): { success: boolean; error?: string } {
  const accounts = getAccounts();
  if (accounts[mobile]) {
    return { success: false, error: "already_registered" };
  }
  accounts[mobile] = {
    password,
    name,
    securityQuestion,
    securityAnswer: securityAnswer.trim().toLowerCase(),
    createdAt: Date.now(),
  };
  saveAccounts(accounts);
  return { success: true };
}

export function loginOwner(mobile: string, password: string): boolean {
  const accounts = getAccounts();
  const account = accounts[mobile];
  if (!account) return false;
  return account.password === password;
}

export function getOwnerName(mobile: string): string {
  const accounts = getAccounts();
  return accounts[mobile]?.name || mobile;
}

export function getOwnerAccount(mobile: string): OwnerAccount | null {
  const accounts = getAccounts();
  return accounts[mobile] || null;
}

export function resetOwnerPassword(
  mobile: string,
  securityAnswer: string,
  newPassword: string,
): { success: boolean; error?: string } {
  const accounts = getAccounts();
  const account = accounts[mobile];
  if (!account) return { success: false, error: "not_found" };
  if (account.securityAnswer !== securityAnswer.trim().toLowerCase()) {
    return { success: false, error: "wrong_answer" };
  }
  accounts[mobile].password = newPassword;
  saveAccounts(accounts);
  return { success: true };
}

export function changeOwnerPassword(mobile: string, newPassword: string) {
  const accounts = getAccounts();
  if (accounts[mobile]) {
    accounts[mobile].password = newPassword;
    saveAccounts(accounts);
  }
}

export function getCurrentOwnerMobile(): string | null {
  return localStorage.getItem("kisan_current_owner");
}

export function setCurrentOwnerMobileStorage(mobile: string | null) {
  if (mobile) {
    localStorage.setItem("kisan_current_owner", mobile);
  } else {
    localStorage.removeItem("kisan_current_owner");
  }
}

function getStoreKey(mobile: string | null): string {
  if (mobile) return `kisan_store_${mobile}`;
  return "kisan_store";
}

function loadFromStorage(mobile: string | null) {
  try {
    const key = getStoreKey(mobile);
    const raw = localStorage.getItem(key);
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

function saveToStorage(mobile: string | null, state: Partial<AppState>) {
  try {
    const key = getStoreKey(mobile);
    const existing = JSON.parse(localStorage.getItem(key) || "{}");
    const toSave = { ...existing, ...state };
    const serialized = JSON.stringify(toSave, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value,
    );
    localStorage.setItem(key, serialized);
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
  ownerMobile: string;
  currentOwnerMobile: string | null;
  driverRequests: DriverRequest[];
  services: string[];
  serviceRates: Record<string, { perHour: number; perMinute: number }>;
  setLanguage: (lang: Language) => void;
  setDarkMode: (dark: boolean) => void;
  setAuthRole: (role: "owner" | "driver" | null) => void;
  setLoggedInDriverId: (id: bigint | null) => void;
  setOwnerPassword: (pwd: string) => void;
  setOwnerMobile: (mobile: string) => void;
  setCurrentOwnerMobile: (mobile: string | null) => void;
  addDriverRequest: (req: DriverRequest) => void;
  updateDriverRequest: (id: string, updates: Partial<DriverRequest>) => void;
  setServices: (services: string[]) => void;
  setServiceRate: (
    name: string,
    rates: { perHour: number; perMinute: number },
  ) => void;
  reloadFromStorage: () => void;
}

const initMobile = getCurrentOwnerMobile();
const stored = loadFromStorage(initMobile);

// Restore session if a valid owner account exists in localStorage
const initAuthRole: "owner" | null =
  initMobile && getAccounts()[initMobile] ? "owner" : null;

export const useAppStore = create<AppState>((set, get) => ({
  language: stored.language ?? "gu",
  darkMode: stored.darkMode ?? false,
  authRole: initAuthRole, // restore session from localStorage
  loggedInDriverId: stored.loggedInDriverId ?? null,
  ownerPassword: stored.ownerPassword ?? "12345",
  ownerMobile: stored.ownerMobile ?? "9624745944",
  currentOwnerMobile: initMobile, // restore from localStorage
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
    saveToStorage(get().currentOwnerMobile, { language: lang });
  },
  setDarkMode: (dark) => {
    set({ darkMode: dark });
    saveToStorage(get().currentOwnerMobile, { darkMode: dark });
  },
  setAuthRole: (role) => {
    set({ authRole: role });
    saveToStorage(get().currentOwnerMobile, { authRole: role });
  },
  setLoggedInDriverId: (id) => {
    set({ loggedInDriverId: id });
    saveToStorage(get().currentOwnerMobile, { loggedInDriverId: id });
  },
  setOwnerPassword: (pwd) => {
    set({ ownerPassword: pwd });
    saveToStorage(get().currentOwnerMobile, { ownerPassword: pwd });
    const mobile = get().currentOwnerMobile || get().ownerMobile;
    if (mobile) changeOwnerPassword(mobile, pwd);
  },
  setOwnerMobile: (mobile) => {
    set({ ownerMobile: mobile });
    saveToStorage(get().currentOwnerMobile, { ownerMobile: mobile });
  },
  setCurrentOwnerMobile: (mobile) => {
    setCurrentOwnerMobileStorage(mobile);
    set({ currentOwnerMobile: mobile });
    if (mobile) {
      const s = loadFromStorage(mobile);
      set({
        language: s.language ?? "gu",
        darkMode: s.darkMode ?? false,
        ownerPassword: s.ownerPassword ?? "12345",
        ownerMobile: s.ownerMobile ?? mobile,
        driverRequests: s.driverRequests ?? [],
        services: s.services ?? [
          "Ploughing",
          "Harvesting",
          "Threshing",
          "Other",
        ],
        serviceRates: s.serviceRates ?? {},
      });
    }
  },
  addDriverRequest: (req) => {
    set((state) => {
      const updated = [...state.driverRequests, req];
      saveToStorage(state.currentOwnerMobile, { driverRequests: updated });
      return { driverRequests: updated };
    });
  },
  updateDriverRequest: (id, updates) => {
    set((state) => {
      const updated = state.driverRequests.map((r) =>
        r.id === id ? { ...r, ...updates } : r,
      );
      saveToStorage(state.currentOwnerMobile, { driverRequests: updated });
      return { driverRequests: updated };
    });
  },
  setServices: (services) => {
    set({ services });
    saveToStorage(get().currentOwnerMobile, { services });
  },
  setServiceRate: (name, rates) => {
    set((state) => {
      const updated = { ...state.serviceRates, [name]: rates };
      saveToStorage(state.currentOwnerMobile, { serviceRates: updated });
      return { serviceRates: updated };
    });
  },
  reloadFromStorage: () => {
    const mobile = get().currentOwnerMobile;
    const s = loadFromStorage(mobile);
    set({
      language: s.language ?? "gu",
      darkMode: s.darkMode ?? false,
      ownerPassword: s.ownerPassword ?? "12345",
      ownerMobile: s.ownerMobile ?? mobile ?? "9624745944",
      driverRequests: s.driverRequests ?? [],
      services: s.services ?? ["Ploughing", "Harvesting", "Threshing", "Other"],
      serviceRates: s.serviceRates ?? {},
    });
  },
}));
