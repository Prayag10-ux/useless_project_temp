export type AuraClassification =
  | "AURALESS"
  | "BACKGROUND CHARACTER"
  | "NPC"
  | "REGULAR HUMAN"
  | "AURA CONTRIBUTOR"
  | "MAIN CHARACTER"
  | "AURA OVERLORD"
  | "COSMIC ENTITY"
  | "ILLEGAL AURA";

export type ThreatLevel =
  | "NONE"
  | "LOW"
  | "MODERATE"
  | "ELEVATED"
  | "HIGH"
  | "CRITICAL"
  | "UNDEFINED";

export type AuraMetric = {
  name: string;
  value: number;
  description: string;
};

export type AuraResult = {
  score: number;
  classification: AuraClassification;
  color: string;
  personality: string;
  threatLevel: ThreatLevel;

  metrics: {
    mainCharacter: number;
    socialGravity: number;
    vibeDensity: number;
    confidenceFlux: number;
    npcResistance: number;
    cosmicAlignment: number;
  };

  metricDetails: AuraMetric[];

  scanMetadata: {
    durationMs: number;
    scanId: string;
    timestamp: number;
  };

  specialMessage?: string;
};
