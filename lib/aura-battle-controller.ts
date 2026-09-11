import type { AuraBattleResult } from "./aura-battle";
import { battleAura } from "./aura-battle";
import {
  createAuraBattleScanner,
  type AuraBattleScanner,
  type BattleMeasurements,
} from "./aura-battle-scanner";

export type AuraBattlePhase =
  | "IDLE"
  | "INITIALIZING"
  | "WAITING_FOR_SUBJECTS"
  | "WAITING_FOR_OPPONENT"
  | "READY"
  | "SCANNING"
  | "COMPLETE"
  | "ERROR";

export type AuraBattleState = {
  phase: AuraBattlePhase;
  progress: number;
  elapsedMs: number;
  faceCount: number;
  measurements: BattleMeasurements;
  result: AuraBattleResult | null;
  error: string | null;
};

export type AuraBattleController = {
  start: () => void;
  stop: () => void;
  getState: () => AuraBattleState;
};

const MAX_BATTLE_DURATION = 7800;

export async function createAuraBattleController(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  onStateChange?: (state: AuraBattleState) => void,
): Promise<AuraBattleController> {
  let scanner: AuraBattleScanner | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;

  let startTime = 0;
  let scanStarted = false;

  let state: AuraBattleState = {
    phase: "IDLE",
    progress: 0,
    elapsedMs: 0,
    faceCount: 0,
    measurements: {
      playerOne: null,
      playerTwo: null,
      faceStatus: "NO_SUBJECTS",
      faceCount: 0,
    },
    result: null,
    error: null,
  };

  const updateState = (
    updates: Partial<AuraBattleState>,
  ) => {
    state = {
      ...state,
      ...updates,
    };

    onStateChange?.({
      ...state,
      measurements: {
        ...state.measurements,
      },
    });
  };

  const stopTimer = () => {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };

  const resetState = () => {
    updateState({
      phase: "IDLE",
      progress: 0,
      elapsedMs: 0,
      faceCount: 0,
      measurements: {
        playerOne: null,
        playerTwo: null,
        faceStatus: "NO_SUBJECTS",
        faceCount: 0,
      },
      result: null,
      error: null,
    });
  };

  const stop = () => {
    stopTimer();

    scanner?.stop();
    scanner = null;

    scanStarted = false;
    startTime = 0;

    resetState();
  };

  const start = async () => {
    if (
      state.phase === "INITIALIZING" ||
      state.phase === "WAITING_FOR_SUBJECTS" ||
      state.phase === "WAITING_FOR_OPPONENT" ||
      state.phase === "READY" ||
      state.phase === "SCANNING"
    ) {
      return;
    }

    try {
      updateState({
        phase: "INITIALIZING",
        progress: 0,
        elapsedMs: 0,
        faceCount: 0,
        result: null,
        error: null,
      });

      scanner =
        await createAuraBattleScanner(
          video,
          canvas,
        );

      scanner.start();

      scanStarted = false;
      startTime = 0;

      updateState({
        phase: "WAITING_FOR_SUBJECTS",
      });

      timer = setInterval(() => {
        if (!scanner) {
          return;
        }

        const measurements =
          scanner.getMeasurements();

        const faceCount =
          measurements.faceCount;

        /*
         * Reject 3+ people immediately.
         */
        if (faceCount > 2) {
          updateState({
            phase: "ERROR",
            faceCount,
            measurements,
            error:
              "TOO MANY SUBJECTS. AURASCAN BATTLE REQUIRES EXACTLY TWO HUMANS.",
          });

          stopTimer();
          scanner.stop();
          scanner = null;
          scanStarted = false;

          return;
        }

        /*
         * Nobody in frame.
         *
         * The battle clock has NOT started yet.
         */
        if (faceCount === 0) {
          updateState({
            phase: "WAITING_FOR_SUBJECTS",
            progress: 0,
            elapsedMs: 0,
            faceCount: 0,
            measurements,
            error: null,
          });

          return;
        }

        /*
         * Only one person in frame.
         *
         * Still waiting. No countdown yet.
         */
        if (faceCount === 1) {
          updateState({
            phase: "WAITING_FOR_OPPONENT",
            progress: 0,
            elapsedMs: 0,
            faceCount: 1,
            measurements,
            error: null,
          });

          return;
        }

        /*
         * Exactly two people detected.
         *
         * Start the actual battle timer only now.
         */
        if (!scanStarted) {
          scanStarted = true;
          startTime = Date.now();

          updateState({
            phase: "READY",
            progress: 0,
            elapsedMs: 0,
            faceCount: 2,
            measurements,
            error: null,
          });

          return;
        }

        /*
         * Two subjects are locked.
         * Now calculate real scan progress.
         */
        const elapsedMs =
          Date.now() - startTime;

        const progress = Math.min(
          100,
          Math.round(
            (elapsedMs /
              MAX_BATTLE_DURATION) *
              100,
          ),
        );

        updateState({
          phase: "SCANNING",
          progress,
          elapsedMs,
          faceCount: 2,
          measurements,
          error: null,
        });

        /*
         * Battle scan complete.
         */
        if (
          elapsedMs >=
          MAX_BATTLE_DURATION
        ) {
          const scanResult =
            scanner.completeScan();

          stopTimer();

          if (!scanResult) {
            updateState({
              phase: "ERROR",
              progress: 100,
              elapsedMs,
              faceCount: 2,
              measurements,
              error:
                "BATTLE SCAN FAILED. EXACTLY TWO SUBJECTS ARE REQUIRED.",
            });

            scanner.stop();
            scanner = null;
            scanStarted = false;

            return;
          }

          const battleResult =
            battleAura(
              scanResult.playerOne,
              scanResult.playerTwo,
            );

          scanner.stop();
          scanner = null;
          scanStarted = false;

          updateState({
            phase: "COMPLETE",
            progress: 100,
            elapsedMs,
            faceCount: 2,
            measurements,
            result: battleResult,
            error: null,
          });
        }
      }, 50);
    } catch (error) {
      stopTimer();

      scanner?.stop();
      scanner = null;

      scanStarted = false;
      startTime = 0;

      updateState({
        phase: "ERROR",
        error:
          error instanceof Error
            ? error.message
            : "Unknown AURA BATTLE error.",
      });
    }
  };

  return {
    start() {
      void start();
    },

    stop,

    getState() {
      return {
        ...state,
        measurements: {
          ...state.measurements,
        },
      };
    },
  };
}
