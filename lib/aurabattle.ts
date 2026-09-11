import {
  createAuraBattleController,
  type AuraBattleController,
  type AuraBattleState,
} from "./aura-battle-controller";
import {
  startAuraCamera,
  stopAuraCamera,
} from "./aura-camera";

export type AuraBattle = {
  start: () => void;
  stop: () => void;
  getState: () => AuraBattleState;
  destroy: () => void;
};

export async function createAuraBattle(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  onStateChange?: (
    state: AuraBattleState
  ) => void,
): Promise<AuraBattle> {
  let stream: MediaStream | null = null;

  let controller: AuraBattleController | null =
    null;

  try {
    /*
     * Start the camera first.
     */
    stream = await startAuraCamera(video);

    /*
     * Create the battle controller.
     * The controller handles:
     *
     * 0 faces  → waiting for subjects
     * 1 face   → waiting for opponent
     * 2 faces  → scanning
     * 3+ faces → error
     */
    controller =
      await createAuraBattleController(
        video,
        canvas,
        (state) => {
          onStateChange?.(state);
        },
      );

    return {
      start() {
        controller?.start();
      },

      stop() {
        controller?.stop();

        stopAuraCamera(stream);

        stream = null;
      },

      getState() {
        return (
          controller?.getState() ?? {
            phase: "ERROR",
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
            error:
              "AURA BATTLE CONTROLLER UNAVAILABLE.",
          }
        );
      },

      destroy() {
        controller?.stop();

        stopAuraCamera(stream);

        stream = null;

        controller = null;
      },
    };
  } catch (error) {
    stopAuraCamera(stream);

    throw error;
  }
}