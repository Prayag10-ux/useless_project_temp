import { generateAura } from "./aura-engine";
import type { AuraResult } from "./aura-types";

export type ScannerMeasurements = {
  movement: number;
  faceStability: number;
  brightness: number;
};

export type AuraScanner = {
  start: () => void;
  stop: () => void;
  getMeasurements: () => ScannerMeasurements;
  completeScan: () => AuraResult;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function calculateBrightness(
  data: Uint8ClampedArray,
  sampleStep = 16
): number {
  let total = 0;
  let samples = 0;

  for (let i = 0; i < data.length; i += 4 * sampleStep) {
    const red = data[i];
    const green = data[i + 1];
    const blue = data[i + 2];

    total += 0.299 * red + 0.587 * green + 0.114 * blue;
    samples++;
  }

  if (samples === 0) {
    return 50;
  }

  return clamp((total / samples / 255) * 100, 0, 100);
}

function calculateFrameDifference(
  current: Uint8ClampedArray,
  previous: Uint8ClampedArray,
  sampleStep = 16
): number {
  if (current.length !== previous.length) {
    return 0;
  }

  let difference = 0;
  let samples = 0;

  for (let i = 0; i < current.length; i += 4 * sampleStep) {
    const redDiff = Math.abs(current[i] - previous[i]);
    const greenDiff = Math.abs(current[i + 1] - previous[i + 1]);
    const blueDiff = Math.abs(current[i + 2] - previous[i + 2]);

    difference += (redDiff + greenDiff + blueDiff) / 3;
    samples++;
  }

  if (samples === 0) {
    return 0;
  }

  return clamp((difference / 255) * 100, 0, 100);
}

export function createAuraScanner(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): AuraScanner {
  const context = canvas.getContext("2d", {
    willReadFrequently: true,
  });

  if (!context) {
    throw new Error("AURASCAN: Canvas context unavailable.");
  }

  let running = false;
  let animationFrame = 0;

  let previousFrame: Uint8ClampedArray | null = null;

  let movementSamples: number[] = [];
  let brightnessSamples: number[] = [];

  let lastMeasurements: ScannerMeasurements = {
    movement: 0,
    faceStability: 100,
    brightness: 50,
  };

  const captureFrame = () => {
    if (!running) {
      return;
    }

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      const width = 160;
      const height = 120;

      canvas.width = width;
      canvas.height = height;

      context.drawImage(video, 0, 0, width, height);

      const imageData = context.getImageData(0, 0, width, height);
      const currentFrame = imageData.data;

      const brightness = calculateBrightness(currentFrame);

      const movement =
        previousFrame === null
          ? 0
          : calculateFrameDifference(currentFrame, previousFrame);

      previousFrame = new Uint8ClampedArray(currentFrame);

      movementSamples.push(movement);
      brightnessSamples.push(brightness);

      if (movementSamples.length > 60) {
        movementSamples.shift();
      }

      if (brightnessSamples.length > 60) {
        brightnessSamples.shift();
      }

      const averageMovement =
        movementSamples.reduce((sum, value) => sum + value, 0) /
        movementSamples.length;

      const averageBrightness =
        brightnessSamples.reduce((sum, value) => sum + value, 0) /
        brightnessSamples.length;

      lastMeasurements = {
        movement: clamp(averageMovement, 0, 100),
        faceStability: clamp(100 - averageMovement, 0, 100),
        brightness: clamp(averageBrightness, 0, 100),
      };
    }

    animationFrame = requestAnimationFrame(captureFrame);
  };

  return {
    start() {
      if (running) {
        return;
      }

      running = true;
      previousFrame = null;
      movementSamples = [];
      brightnessSamples = [];

      animationFrame = requestAnimationFrame(captureFrame);
    },

    stop() {
      running = false;

      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }

      animationFrame = 0;
    },

    getMeasurements() {
      return { ...lastMeasurements };
    },

    completeScan() {
      const measurements = this.getMeasurements();

      return generateAura({
        movement: measurements.movement,
        faceStability: measurements.faceStability,
        brightness: measurements.brightness,
      });
    },
  };
}
