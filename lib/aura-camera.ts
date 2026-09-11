export async function startAuraCamera(
  video: HTMLVideoElement
): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("AURASCAN: Camera access is not supported.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: "user",
      width: { ideal: 640 },
      height: { ideal: 480 },
    },
    audio: false,
  });

  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;

  await video.play();

  return stream;
}

export function stopAuraCamera(
  stream: MediaStream | null
): void {
  if (!stream) {
    return;
  }

  for (const track of stream.getTracks()) {
    track.stop();
  }
}