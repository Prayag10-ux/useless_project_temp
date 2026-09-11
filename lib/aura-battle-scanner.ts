import {
  FaceDetector,
  FilesetResolver,
  type Detection,
} from "@mediapipe/tasks-vision";
import { generateAura } from "./aura-engine";
import type { AuraResult } from "./aura-types";

export type BattleFaceStatus =
  | "NO_SUBJECTS"
  | "ONE_SUBJECT"
  | "TWO_SUBJECTS"
  | "TOO_MANY_SUBJECTS";

export type BattleMeasurements = {
  playerOne: {
    movement: number;
    faceStability: number;
    brightness: number;
  } | null;

  playerTwo: {
    movement: number;
    faceStability: number;
    brightness: number;
  } | null;

  faceStatus: BattleFaceStatus;
  faceCount: number;
};

export type AuraBattleScanner = {
  start: () => void;
  stop: () => void;
  getMeasurements: () => BattleMeasurements;
  completeScan: () => {
    playerOne: AuraResult;
    playerTwo: AuraResult;
  } | null;
};

function clamp(
  value: number,
  min: number,
  max: number
): number {
  return Math.min(Math.max(value, min), max);
}

function calculateBrightness(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  regionWidth: number,
  regionHeight: number
): number {
  const startX = Math.max(0, Math.floor(x));
  const startY = Math.max(0, Math.floor(y));

  const endX = Math.min(
    width,
    Math.ceil(x + regionWidth)
  );

  const endY = Math.min(
    height,
    Math.ceil(y + regionHeight)
  );

  let total = 0;
  let samples = 0;

  /*
   * Sample every 8th pixel.
   * We don't need pixel-perfect analysis because
   * this is intentionally fake aura science.
   */
  for (let py = startY; py < endY; py += 8) {
    for (let px = startX; px < endX; px += 8) {
      const index = (py * width + px) * 4;

      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];

      total +=
        0.299 * red +
        0.587 * green +
        0.114 * blue;

      samples++;
    }
  }

  if (samples === 0) {
    return 50;
  }

  return clamp(
    (total / samples / 255) * 100,
    0,
    100
  );
}

function getFaceCenter(
  detection: Detection,
  width: number,
  height: number
) {
  const box = detection.boundingBox;

  if (!box) {
    return null;
  }

  return {
    x: (box.originX + box.width / 2) / width,
    y: (box.originY + box.height / 2) / height,
    width: box.width / width,
    height: box.height / height,
  };
}

function sortFaces(
  detections: Detection[],
  width: number,
  height: number
): Detection[] {
  return [...detections].sort((a, b) => {
    const faceA = getFaceCenter(a, width, height);
    const faceB = getFaceCenter(b, width, height);

    if (!faceA || !faceB) {
      return 0;
    }

    /*
     * Left face = Player 01
     * Right face = Player 02
     */
    return faceA.x - faceB.x;
  });
}

export async function createAuraBattleScanner(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): Promise<AuraBattleScanner> {
  const context = canvas.getContext("2d", {
    willReadFrequently: true,
  });

  if (!context) {
    throw new Error(
      "AURA BATTLE: Canvas context unavailable."
    );
  }

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  const faceDetector =
    await FaceDetector.createFromOptions(
      vision,
      {
        baseOptions: {
          modelAssetPath:
            "/models/face_detector.tflite",
        },

        runningMode: "VIDEO",

        minDetectionConfidence: 0.5,

        minSuppressionThreshold: 0.3,
      }
    );

  let running = false;

  let animationFrame = 0;

  let previousMeasurements = [
    {
      x: 0,
      y: 0,
    },
    {
      x: 0,
      y: 0,
    },
  ];

  let movementSamples = [
    [] as number[],
    [] as number[],
  ];

  let brightnessSamples = [
    [] as number[],
    [] as number[],
  ];

  let lastMeasurements: BattleMeasurements = {
    playerOne: null,
    playerTwo: null,
    faceStatus: "NO_SUBJECTS",
    faceCount: 0,
  };

  const captureFrame = () => {
    if (!running) {
      return;
    }

    if (
      video.readyState >=
      HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      const width = 320;
      const height = 240;

      canvas.width = width;
      canvas.height = height;

      context.drawImage(
        video,
        0,
        0,
        width,
        height
      );

      let detections: Detection[] = [];

      try {
        const detectionResult =
          faceDetector.detectForVideo(
            video,
            performance.now()
          );

        detections = detectionResult.detections;
      } catch {
        detections = [];
      }

      /*
       * Ignore tiny/invalid detections.
       */
      const validDetections = detections.filter(
        (detection) => {
          const box = detection.boundingBox;

          if (!box) {
            return false;
          }

          return (
            box.width >= 30 &&
            box.height >= 30
          );
        }
      );

      const faceCount = validDetections.length;

      let faceStatus: BattleFaceStatus;

      if (faceCount === 0) {
        faceStatus = "NO_SUBJECTS";
      } else if (faceCount === 1) {
        faceStatus = "ONE_SUBJECT";
      } else if (faceCount === 2) {
        faceStatus = "TWO_SUBJECTS";
      } else {
        faceStatus = "TOO_MANY_SUBJECTS";
      }

      /*
       * We only analyse the first two faces.
       */
      const faces = sortFaces(
        validDetections.slice(0, 2),
        width,
        height
      );

      const imageData = context.getImageData(
        0,
        0,
        width,
        height
      );

      const pixels = imageData.data;

      const playerMeasurements: Array<
        BattleMeasurements["playerOne"]
      > = [null, null];

      for (
        let playerIndex = 0;
        playerIndex < faces.length &&
        playerIndex < 2;
        playerIndex++
      ) {
        const face = faces[playerIndex];

        const center = getFaceCenter(
          face,
          width,
          height
        );

        if (!center) {
          continue;
        }

        /*
         * Convert normalized coordinates back
         * into canvas coordinates.
         */
        const centerX = center.x * width;
        const centerY = center.y * height;

        const previous =
          previousMeasurements[playerIndex];

        const movement = clamp(
          Math.sqrt(
            Math.pow(
              centerX -
                previous.x * width,
              2
            ) +
              Math.pow(
                centerY -
                  previous.y * height,
                2
              )
          ) * 2,
          0,
          100
        );

        previousMeasurements[playerIndex] = {
          x: center.x,
          y: center.y,
        };

        const brightness =
          calculateBrightness(
            pixels,
            width,
            height,
            face.boundingBox?.originX ?? 0,
            face.boundingBox?.originY ?? 0,
            face.boundingBox?.width ?? 1,
            face.boundingBox?.height ?? 1
          );

        movementSamples[playerIndex].push(
          movement
        );

        brightnessSamples[playerIndex].push(
          brightness
        );

        if (
          movementSamples[playerIndex].length >
          60
        ) {
          movementSamples[playerIndex].shift();
        }

        if (
          brightnessSamples[playerIndex].length >
          60
        ) {
          brightnessSamples[playerIndex].shift();
        }

        const averageMovement =
          movementSamples[playerIndex].reduce(
            (sum, value) => sum + value,
            0
          ) /
          movementSamples[playerIndex].length;

        const averageBrightness =
          brightnessSamples[playerIndex].reduce(
            (sum, value) => sum + value,
            0
          ) /
          brightnessSamples[playerIndex].length;

        playerMeasurements[playerIndex] = {
          movement: clamp(
            averageMovement,
            0,
            100
          ),

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
        };
      }

      /*
       * If a player disappears, clear their
       * measurements so an old face cannot
       * accidentally produce a result.
       */
      if (faces.length < 1) {
        playerMeasurements[0] = null;
      }

      if (faces.length < 2) {
        playerMeasurements[1] = null;
      }

      lastMeasurements = {
        playerOne: playerMeasurements[0],
        playerTwo: playerMeasurements[1],
        faceStatus,
        faceCount,
      };
    }

    animationFrame =
      requestAnimationFrame(captureFrame);
  };

  return {
    start() {
      if (running) {
        return;
      }

      running = true;

      previousMeasurements = [
        {
          x: 0,
          y: 0,
        },
        {
          x: 0,
          y: 0,
        },
      ];

      movementSamples = [
        [],
        [],
      ];

      brightnessSamples = [
        [],
        [],
      ];

      lastMeasurements = {
        playerOne: null,
        playerTwo: null,
        faceStatus: "NO_SUBJECTS",
        faceCount: 0,
      };

      animationFrame =
        requestAnimationFrame(captureFrame);
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
      return {
        ...lastMeasurements,
        playerOne: lastMeasurements.playerOne
          ? {
              ...lastMeasurements.playerOne,
            }
          : null,
        playerTwo: lastMeasurements.playerTwo
          ? {
              ...lastMeasurements.playerTwo,
            }
          : null,
      };
    },

    completeScan() {
      /*
       * A real battle requires exactly two
       * detected subjects at the end.
       */
      if (
        lastMeasurements.faceStatus !==
        "TWO_SUBJECTS"
      ) {
        return null;
      }

      const playerOne =
        lastMeasurements.playerOne;

      const playerTwo =
        lastMeasurements.playerTwo;

      if (!playerOne || !playerTwo) {
        return null;
      }

      const auraOne = generateAura({
        movement: playerOne.movement,
        faceStability:
          playerOne.faceStability,
        brightness: playerOne.brightness,
      });

      const auraTwo = generateAura({
        movement: playerTwo.movement,
        faceStability:
          playerTwo.faceStability,
        brightness: playerTwo.brightness,
      });

      return {
        playerOne: auraOne,
        playerTwo: auraTwo,
      };
    },
  };
}