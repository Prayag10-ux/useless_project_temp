import type { AuraResult } from "./aura-types";

const SESSION_KEY = "aurascan-current-result";

export function saveAuraResult(result: AuraResult): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify(result)
  );
}

export function getAuraResult(): AuraResult | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.sessionStorage.getItem(SESSION_KEY);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as AuraResult;
  } catch {
    return null;
  }
}

export function clearAuraResult(): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(SESSION_KEY);
  }
}