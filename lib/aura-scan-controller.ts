import type { AuraResult } from "./aura-types";
import { createAuraScanner, type AuraScanner } from "./aura-scanner";

export type AuraScanPhase =
  | "IDLE"
  | "INITIALIZING"
  | "SCANNING"
  | "COMPLETE"
  | "ERROR";

export type AuraScanState = {
  phase: AuraScanPhase;
  progress: number;
  elapsedMs: number;
  result: AuraResult | null;
  error: string | null;
  faceDetected: boolean;
};

export type AuraScanController = {
  start: () => void;
  stop: () => void;
  getState: () => AuraScanState;
};

const MAX_SCAN_DURATION = 7800;

export function createAuraScanController(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  onStateChange?: (state: AuraScanState) => void
): AuraScanController {
  let scanner: AuraScanner | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  let startTime = 0;

  let state: AuraScanState = {
    phase: "IDLE",
    progress: 0,
    elapsedMs: 0,
    result: null,
    error: null,
    faceDetected: false,
  };

  const updateState = (updates: Partial<AuraScanState>) => {
    state = {
      ...state,
      ...updates,
    };

    onStateChange?.({ ...state });
  };

  const stopTimer = () => {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };

  const stop = () => {
    stopTimer();
    scanner?.stop();
    scanner = null;

    updateState({
      phase: "IDLE",
      progress: 0,
      elapsedMs: 0,
      result: null,
      error: null,
      faceDetected: false,
    });
  };

  const start = async () => {
    if (
      state.phase === "INITIALIZING" ||
      state.phase === "SCANNING"
    ) {
      return;
    }

    try {
      updateState({
        phase: "INITIALIZING",
        progress: 0,
        elapsedMs: 0,
        result: null,
        error: null,
        faceDetected: false,
      });

      scanner = await createAuraScanner(video, canvas);
      scanner.start();

      startTime = Date.now();

      updateState({
        phase: "SCANNING",
      });

      timer = setInterval(() => {
        if (!scanner) return;

        const elapsedMs = Date.now() - startTime;
        const measurements = scanner.getMeasurements();

        const progress = Math.min(
          100,
          Math.round((elapsedMs / MAX_SCAN_DURATION) * 100)
        );

        updateState({
          elapsedMs,
          progress,
          faceDetected: measurements.faceDetected,
        });

        if (elapsedMs >= MAX_SCAN_DURATION) {
          const result = scanner.completeScan();

          if (!result) {
            updateState({
              phase: "ERROR",
              error:
                "SUBJECT NOT FOUND. AURASCAN REQUIRES A HUMAN TARGET.",
              faceDetected: false,
            });

            stopTimer();
            return;
          }

          scanner.stop();
          stopTimer();

          updateState({
            phase: "COMPLETE",
            progress: 100,
            elapsedMs,
            result,
            faceDetected: true,
          });
        }
      }, 50);
    } catch (error) {
      stopTimer();

      updateState({
        phase: "ERROR",
        error:
          error instanceof Error
            ? error.message
            : "Unknown AURASCAN error.",
      });
    }
  };

  return {
    start() {
      void start();
    },

    stop,

    getState: () => ({ ...state }),
  };
}
