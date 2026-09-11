import { AURA_PROFILES, SPECIAL_MESSAGES } from "./aura-data";
import type { AuraResult } from "./aura-types";

type AuraInput = {
  movement?: number;
  faceStability?: number;
  brightness?: number;
  scanDuration?: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateScanId(): string {
  return `AURA-${Date.now().toString(36).toUpperCase()}-${Math.floor(
    Math.random() * 9999
  )
    .toString()
    .padStart(4, "0")}`;
}

function getProfile(score: number) {
  return (
    AURA_PROFILES.find(
      (profile) => score >= profile.minScore && score <= profile.maxScore
    ) ?? AURA_PROFILES[0]
  );
}

function generateMetric(base: number, variation = 12): number {
  return Math.round(clamp(base + randomBetween(-variation, variation), 0, 100));
}

export function generateAura(input: AuraInput = {}): AuraResult {
  const movement = clamp(input.movement ?? randomBetween(20, 80), 0, 100);
  const faceStability = clamp(
    input.faceStability ?? randomBetween(50, 100),
    0,
    100
  );
  const brightness = clamp(
    input.brightness ?? randomBetween(35, 85),
    0,
    100
  );

  /*
   * IMPORTANT:
   * This is intentionally NOT a scientifically valid measurement.
   *
   * AURASCAN is a useless-project hackathon joke.
   * The inputs merely make the result feel responsive to the scan.
   */

  const mainCharacter = generateMetric(
    faceStability * 0.65 + brightness * 0.35
  );

  const socialGravity = generateMetric(
    faceStability * 0.55 + movement * 0.45
  );

  const vibeDensity = generateMetric(
    brightness * 0.6 + movement * 0.4
  );

  const confidenceFlux = generateMetric(
    faceStability * 0.7 + movement * 0.3
  );

  const npcResistance = generateMetric(
    movement * 0.65 + faceStability * 0.35
  );

  const cosmicAlignment = generateMetric(
    brightness * 0.7 + faceStability * 0.3
  );

  const average =
    (mainCharacter +
      socialGravity +
      vibeDensity +
      confidenceFlux +
      npcResistance +
      cosmicAlignment) /
    6;

  // Convert 0–100 metrics into the ridiculous 0–1000 AU scale.
  let score = Math.round(average * 10);

  /*
   * Add a small amount of controlled chaos.
   * The scanner should never feel perfectly deterministic.
   */
  score += Math.round(randomBetween(-35, 35));
  score = clamp(score, 0, 1000);

  const profile = getProfile(score);

  const durationMs =
    input.scanDuration ?? Math.round(randomBetween(5200, 7800));

  const specialMessage =
    score < 100
      ? SPECIAL_MESSAGES.LOW_AURA
      : score === 666
        ? SPECIAL_MESSAGES.DEMONIC
        : score > 950
          ? SPECIAL_MESSAGES.EXCESSIVE
          : undefined;

  return {
    score,
    classification: profile.classification,
    color: profile.color,
    personality: profile.personality,
    threatLevel: profile.threatLevel,

    metrics: {
      mainCharacter,
      socialGravity,
      vibeDensity,
      confidenceFlux,
      npcResistance,
      cosmicAlignment,
    },

    metricDetails: [
      {
        name: "Main Character Energy",
        value: mainCharacter,
        description: "Measures unexplained protagonist activity.",
      },
      {
        name: "Social Gravity",
        value: socialGravity,
        description: "Estimated ability to attract nearby attention.",
      },
      {
        name: "Vibe Density",
        value: vibeDensity,
        description: "Aura concentration per square meter.",
      },
      {
        name: "Confidence Flux",
        value: confidenceFlux,
        description: "Rate at which confidence appears to fluctuate.",
      },
      {
        name: "NPC Resistance",
        value: npcResistance,
        description: "Resistance to becoming background scenery.",
      },
      {
        name: "Cosmic Alignment",
        value: cosmicAlignment,
        description: "Compatibility with currently known dimensions.",
      },
    ],

    scanMetadata: {
      durationMs,
      scanId: generateScanId(),
      timestamp: Date.now(),
    },

    specialMessage,
  };
}
