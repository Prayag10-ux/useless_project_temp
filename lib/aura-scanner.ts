import {
  FaceDetector,
  FilesetResolver,
} from "@mediapipe/tasks-vision";
import { generateAura } from "./aura-engine";
import type { AuraResult } from "./aura-types";

export type ScannerMeasurements = {
  movement: number;
  faceStability: number;
  brightness: number;
  faceDetected: boolean;
};

export type AuraScanner = {
  start: () => void;
  stop: () => void;
  getMeasurements: () => ScannerMeasurements;
  completeScan: () => AuraResult | null;
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

export async function createAuraScanner(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): Promise<AuraScanner> {
  const context = canvas.getContext("2d", {
    willReadFrequently: true,
  });

  if (!context) {
    throw new Error("AURASCAN: Canvas context unavailable.");
  }

  /*
   * Initialize MediaPipe Face Detector.
   *
   * The model itself is stored locally in:
   * /public/models/face_detector.tflite
   *
   * The MediaPipe WASM runtime is loaded from jsDelivr.
   */
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  const faceDetector = await FaceDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "/models/face_detector.tflite",
    },
    runningMode: "VIDEO",
    minDetectionConfidence: 0.5,
    minSuppressionThreshold: 0.3,
  });

  let running = false;
  let animationFrame = 0;

  let previousFrame: Uint8ClampedArray | null = null;

  let movementSamples: number[] = [];
  let brightnessSamples: number[] = [];

  let faceDetected = false;

  let lastMeasurements: ScannerMeasurements = {
    movement: 0,
    faceStability: 100,
    brightness: 50,
    faceDetected: false,
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

      /*
       * Draw the current camera frame onto the hidden analysis canvas.
       */
      context.drawImage(video, 0, 0, width, height);

      /*
       * REAL FACE DETECTION
       *
       * This is the important part.
       *
       * We are not identifying the person.
       * We are only checking whether a face exists.
       */
      try {
        const detectionResult = faceDetector.detectForVideo(
          video,
          performance.now()
        );

        faceDetected = detectionResult.detections.length > 0;
      } catch {
        /*
         * If one frame fails, don't kill the entire scan.
         * The next frame will try again.
         */
        faceDetected = false;
      }

      const imageData = context.getImageData(
        0,
        0,
        width,
        height
      );

      const currentFrame = imageData.data;

      const brightness = calculateBrightness(currentFrame);

      const movement =
        previousFrame === null
          ? 0
          : calculateFrameDifference(
              currentFrame,
              previousFrame
            );

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
        movementSamples.reduce(
          (sum, value) => sum + value,
          0
        ) / movementSamples.length;

      const averageBrightness =
        brightnessSamples.reduce(
          (sum, value) => sum + value,
          0
        ) / brightnessSamples.length;

      lastMeasurements = {
        movement: clamp(averageMovement, 0, 100),

        /*
         * This remains intentionally fake.
         * Face detection is real, aura measurement is not.
         */
        faceStability: clamp(
          100 - averageMovement,
          0,
          100
        ),

        brightness: clamp(
          averageBrightness,
          0,
          100
        ),

        faceDetected,
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
      faceDetected = false;

      lastMeasurements = {
        movement: 0,
        faceStability: 100,
        brightness: 50,
        faceDetected: false,
      };

      animationFrame = requestAnimationFrame(
        captureFrame
      );
    },

    stop() {
      running = false;

      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }

      animationFrame = 0;

      faceDetector.close();
    },

    getMeasurements() {
      return { ...lastMeasurements };
    },

    completeScan() {
      const measurements = lastMeasurements;

      /*
       * NO FACE = NO AURA.
       *
       * This prevents the scanner from generating
       * a random score when nobody is in front of it.
       */
      if (!measurements.faceDetected) {
        return null;
      }

      return generateAura({
        movement: measurements.movement,
        faceStability: measurements.faceStability,
        brightness: measurements.brightness,
      });
    },
  };
}