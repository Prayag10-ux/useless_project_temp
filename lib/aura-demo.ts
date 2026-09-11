import type { AuraResult } from "./aura-types";
import { generateAura } from "./aura-engine";

export type AuraDemoMode =
  | "NORMAL"
  | "DEMONIC"
  | "LOW_AURA"
  | "ILLEGAL"
  | "INSECURITY"
  | "MANIPULATION";

export function generateDemoAura(mode: AuraDemoMode): AuraResult {
  switch (mode) {
    case "DEMONIC":
      return generateAura({
        specialEvent: "DEMONIC",
        scanDuration: 6660,
      });

    case "INSECURITY":
      return generateAura({
        specialEvent: "INSECURITY",
        scanDuration: 5200,
      });

    case "MANIPULATION":
      return generateAura({
        specialEvent: "MANIPULATION",
        scanDuration: 6000,
      });

    case "LOW_AURA":
      return createFixedDemoResult({
        score: 42,
        message: "AURA NOT FOUND",
        classification: "AURALESS",
        color: "#6B7280",
        personality: "Energetically Unavailable",
        threatLevel: "NONE",
      });

    case "ILLEGAL":
      return createFixedDemoResult({
        score: 999,
        message: "PLEASE STOP",
        classification: "ILLEGAL AURA",
        color: "#EF4444",
        personality: "Legally Concerning",
        threatLevel: "UNDEFINED",
      });

    case "NORMAL":
    default:
      return generateAura();
  }
}

function createFixedDemoResult({
  score,
  message,
  classification,
  color,
  personality,
  threatLevel,
}: {
  score: number;
  message: string;
  classification: AuraResult["classification"];
  color: string;
  personality: string;
  threatLevel: AuraResult["threatLevel"];
  }): AuraResult {
  const metrics = {
    mainCharacter: score === 42 ? 4 : 100,
    socialGravity: score === 42 ? 7 : 98,
    vibeDensity: score === 42 ? 3 : 100,
    confidenceFlux: score === 42 ? 5 : 97,
    npcResistance: score === 42 ? 8 : 100,
    cosmicAlignment: score === 42 ? 6 : 99,
  };

  return {
    score,
    classification,
    color,
    personality,
    threatLevel,

    metrics,

    metricDetails: [
      {
        name: "Main Character Energy",
        value: metrics.mainCharacter,
        description: "Measures unexplained protagonist activity.",
      },
      {
        name: "Social Gravity",
        value: metrics.socialGravity,
        description: "Estimated ability to attract nearby attention.",
      },
      {
        name: "Vibe Density",
        value: metrics.vibeDensity,
        description: "Aura concentration per square meter.",
      },
      {
        name: "Confidence Flux",
        value: metrics.confidenceFlux,
        description: "Rate at which confidence appears to fluctuate.",
      },
      {
        name: "NPC Resistance",
        value: metrics.npcResistance,
        description: "Resistance to becoming background scenery.",
      },
      {
        name: "Cosmic Alignment",
        value: metrics.cosmicAlignment,
        description: "Compatibility with currently known dimensions.",
      },
    ],

    scanMetadata: {
      durationMs: 6000,
      scanId: `DEMO-${Date.now().toString(36).toUpperCase()}`,
      timestamp: Date.now(),
    },

    specialMessage: message,
  };
}