import type { AuraClassification, ThreatLevel } from "./aura-types";

export type AuraProfile = {
  classification: AuraClassification;
  minScore: number;
  maxScore: number;
  color: string;
  personality: string;
  threatLevel: ThreatLevel;
  description: string;
};

export const AURA_PROFILES: AuraProfile[] = [
  {
    classification: "AURALESS",
    minScore: 0,
    maxScore: 99,
    color: "#6B7280",
    personality: "Energetically Unavailable",
    threatLevel: "NONE",
    description: "No measurable aura detected. The system remains deeply concerned.",
  },
  {
    classification: "BACKGROUND CHARACTER",
    minScore: 100,
    maxScore: 199,
    color: "#64748B",
    personality: "Mildly Present",
    threatLevel: "LOW",
    description: "Technically present. Narratively questionable.",
  },
  {
    classification: "NPC",
    minScore: 200,
    maxScore: 299,
    color: "#94A3B8",
    personality: "Algorithmically Predictable",
    threatLevel: "LOW",
    description: "Aura patterns suggest routine human behavior.",
  },
  {
    classification: "REGULAR HUMAN",
    minScore: 300,
    maxScore: 449,
    color: "#60A5FA",
    personality: "Statistically Normal",
    threatLevel: "MODERATE",
    description: "A completely ordinary amount of aura.",
  },
  {
    classification: "AURA CONTRIBUTOR",
    minScore: 450,
    maxScore: 599,
    color: "#22C55E",
    personality: "Socially Significant",
    threatLevel: "MODERATE",
    description: "Contributes measurable aura to surrounding environments.",
  },
  {
    classification: "MAIN CHARACTER",
    minScore: 600,
    maxScore: 749,
    color: "#A855F7",
    personality: "Cinematically Significant",
    threatLevel: "ELEVATED",
    description: "Environmental attention appears to increase in proximity.",
  },
  {
    classification: "AURA OVERLORD",
    minScore: 750,
    maxScore: 849,
    color: "#F59E0B",
    personality: "Charismatically Unreasonable",
    threatLevel: "HIGH",
    description: "Aura output exceeds normal human operating parameters.",
  },
  {
    classification: "COSMIC ENTITY",
    minScore: 850,
    maxScore: 949,
    color: "#06B6D4",
    personality: "Dimensionally Unclear",
    threatLevel: "CRITICAL",
    description: "Subject may possess awareness of additional dimensions.",
  },
  {
    classification: "ILLEGAL AURA",
    minScore: 950,
    maxScore: 1000,
    color: "#EF4444",
    personality: "Legally Concerning",
    threatLevel: "UNDEFINED",
    description: "Aura exceeds permitted civilian limits.",
  },
];

export const PERSONALITY_SUFFIXES = [
  "Suspiciously Confident",
  "Aggressively Chill",
  "Chronically Unbothered",
  "Socially Dangerous",
  "Mildly Overpowered",
  "Unnecessarily Charismatic",
  "Emotionally Well-Rendered",
  "Statistically Concerning",
];

export const SPECIAL_MESSAGES = {
  LOW_AURA: "AURA NOT FOUND",
  DEMONIC: "DEMONIC AURA DETECTED",
  EXCESSIVE: "PLEASE STOP",
  INSECURITY: "INSECURITY DETECTED. -40 AURA",
  MANIPULATION: "SUBJECT ATTEMPTED TO MANIPULATE AURA READINGS.",
} as const;
