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
  onStateChange?: (
    state: AuraBattleState
  ) => void,
): Promise<AuraBattleController> {
  let scanner: AuraBattleScanner | null = null;

  let timer: ReturnType<typeof setInterval> | null =
    null;

  let startTime = 0;

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
    updates: Partial<AuraBattleState>
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

  const stop = () => {
    stopTimer();

    scanner?.stop();

    scanner = null;

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
          canvas
        );

      scanner.start();

      updateState({
        phase: "WAITING_FOR_SUBJECTS",
      });

      startTime = Date.now();

      timer = setInterval(() => {
        if (!scanner) {
          return;
        }

        const elapsedMs =
          Date.now() - startTime;

        const measurements =
          scanner.getMeasurements();

        const faceCount =
          measurements.faceCount;

        const progress = Math.min(
          100,
          Math.round(
            (elapsedMs /
              MAX_BATTLE_DURATION) *
              100
          )
        );

        let phase: AuraBattlePhase;

        if (faceCount === 0) {
          phase =
            "WAITING_FOR_SUBJECTS";
        } else if (faceCount === 1) {
          phase =
            "WAITING_FOR_OPPONENT";
        } else if (faceCount === 2) {
          phase = "SCANNING";
        } else {
          phase = "ERROR";
        }

        updateState({
          phase,

          progress,

          elapsedMs,

          faceCount,

          measurements,

          error:
            faceCount > 2
              ? "TOO MANY SUBJECTS. AURASCAN BATTLE REQUIRES EXACTLY TWO HUMANS."
              : null,
        });

        /*
         * Battle completes only after two faces
         * have been detected and the scan reaches
         * the maximum duration.
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

              error:
                faceCount === 0
                  ? "NO SUBJECTS DETECTED. AURA BATTLE REQUIRES TWO HUMANS."
                  : faceCount === 1
                    ? "OPPONENT NOT DETECTED. AURA BATTLE REQUIRES TWO HUMANS."
                    : "BATTLE SCAN FAILED. EXACTLY TWO SUBJECTS ARE REQUIRED.",
            });

            scanner.stop();

            scanner = null;

            return;
          }

          const battleResult =
            battleAura(
              scanResult.playerOne,
              scanResult.playerTwo
            );

          scanner.stop();

          scanner = null;

          updateState({
            phase: "COMPLETE",

            progress: 100,

            elapsedMs,

            faceCount: 2,

            result: battleResult,

            error: null,
          });
        }
      }, 50);
    } catch (error) {
      stopTimer();

      scanner?.stop();

      scanner = null;

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