import type { AuraResult } from "./aura-types";
import {
  createAuraScanController,
  type AuraScanController,
  type AuraScanState,
} from "./aura-scan-controller";
import { startAuraCamera, stopAuraCamera } from "./aura-camera";
import { saveAuraResult } from "./aura-session";

export type AuraScan = {
  start: () => void;
  stop: () => void;
  getState: () => AuraScanState;
  destroy: () => void;
};

export async function createAuraScan(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  onStateChange?: (state: AuraScanState) => void,
): Promise<AuraScan> {
  let stream: MediaStream | null = null;
  let controller: AuraScanController | null = null;

  try {
    stream = await startAuraCamera(video);

    controller = createAuraScanController(
      video,
      canvas,
      (state) => {
        if (state.phase === "COMPLETE" && state.result) {
          saveAuraResult(state.result);
        }

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
            result: null,
            error: "AURASCAN controller unavailable.",
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
