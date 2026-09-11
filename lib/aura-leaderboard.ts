import type { AuraResult } from "./aura-types";

export type LeaderboardEntry = {
  id: string;
  playerName: string;
  score: number;
  classification: AuraResult["classification"];
  color: string;
  timestamp: number;
};

const STORAGE_KEY = "aurascan-leaderboard";

const DEFAULT_ENTRIES: LeaderboardEntry[] = [
  {
    id: "seed-1",
    playerName: "AURA SUPREME",
    score: 987,
    classification: "ILLEGAL AURA",
    color: "#EF4444",
    timestamp: 0,
  },
  {
    id: "seed-2",
    playerName: "The Main Character",
    score: 843,
    classification: "AURA OVERLORD",
    color: "#F59E0B",
    timestamp: 0,
  },
  {
    id: "seed-3",
    playerName: "Definitely Human",
    score: 771,
    classification: "AURA OVERLORD",
    color: "#F59E0B",
    timestamp: 0,
  },
  {
    id: "seed-4",
    playerName: "NPC Survivor",
    score: 694,
    classification: "MAIN CHARACTER",
    color: "#A855F7",
    timestamp: 0,
  },
  {
    id: "seed-5",
    playerName: "Background Legend",
    score: 512,
    classification: "AURA CONTRIBUTOR",
    color: "#22C55E",
    timestamp: 0,
  },
];

function sortEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => b.score - a.score);
}

export function getLeaderboard(): LeaderboardEntry[] {
  if (typeof window === "undefined") {
    return sortEntries(DEFAULT_ENTRIES);
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(DEFAULT_ENTRIES)
    );

    return sortEntries(DEFAULT_ENTRIES);
  }

  try {
    const entries = JSON.parse(stored) as LeaderboardEntry[];

    if (!Array.isArray(entries)) {
      return sortEntries(DEFAULT_ENTRIES);
    }

    return sortEntries(entries);
  } catch {
    return sortEntries(DEFAULT_ENTRIES);
  }
}

export function addToLeaderboard(
  playerName: string,
  result: AuraResult
): LeaderboardEntry {
  const entry: LeaderboardEntry = {
    id: result.scanMetadata.scanId,
    playerName:
      playerName.trim().slice(0, 24) || "UNKNOWN SUBJECT",
    score: result.score,
    classification: result.classification,
    color: result.color,
    timestamp: Date.now(),
  };

  if (typeof window === "undefined") {
    return entry;
  }

  const entries = getLeaderboard();

  const updatedEntries = sortEntries([
    ...entries,
    entry,
  ]).slice(0, 100);

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedEntries)
  );

  return entry;
}

export function getLeaderboardTop(
  limit = 10
): LeaderboardEntry[] {
  return getLeaderboard().slice(0, Math.max(1, limit));
}

export function getPlayerRank(
  entryId: string
): number | null {
  const entries = getLeaderboard();

  const index = entries.findIndex(
    (entry) => entry.id === entryId
  );

  return index === -1 ? null : index + 1;
}

export function clearLeaderboard(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}