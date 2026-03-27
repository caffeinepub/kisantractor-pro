import { getCurrentOwnerMobile } from "../store";

// bigint-safe JSON serialization
function serialize(data: unknown): string {
  return JSON.stringify(data, (_k, v) =>
    typeof v === "bigint" ? { __bigint__: v.toString() } : v,
  );
}

function deserialize(raw: string): unknown {
  return JSON.parse(raw, (_k, v) => {
    if (v && typeof v === "object" && "__bigint__" in v) {
      return BigInt((v as { __bigint__: string }).__bigint__);
    }
    return v;
  });
}

export function getCache<T>(key: string): T[] {
  try {
    const mobile = getCurrentOwnerMobile() ?? "shared";
    const raw = localStorage.getItem(`kisan_cache_${mobile}_${key}`);
    if (!raw) return [];
    return deserialize(raw) as T[];
  } catch {
    return [];
  }
}

export function setCache<T>(key: string, data: T[]): void {
  try {
    const mobile = getCurrentOwnerMobile() ?? "shared";
    localStorage.setItem(`kisan_cache_${mobile}_${key}`, serialize(data));
  } catch {
    // quota exceeded or other error — ignore
  }
}
