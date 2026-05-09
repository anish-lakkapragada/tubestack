import { useEffect, useRef, useState } from "react";

const ASCII_RAMP = " .,:;irsXA253hMHGS#9B&@";

type CameraState = "idle" | "requesting" | "live" | "error";

export default function Face() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [error, setError] = useState("");
  const [cellSize, setCellSize] = useState(12);
  const [textOpacity, setTextOpacity] = useState(0.95);
  const [tileOpacity, setTileOpacity] = useState(0.2);

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("webcam access is unavailable in this browser");
      setCameraState("error");
      return;
    }

    setCameraState("requesting");
    setError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState("live");
    } catch (err) {
      const message = err instanceof Error ? err.message : "camera permission was not granted";
      setError(message);
      setCameraState("error");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraState("idle");
  }

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (cameraState !== "live") return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    const sampleCanvas = document.createElement("canvas");
    const sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });
    if (!ctx || !sampleCtx) return;

    const drawCanvas = canvas;
    const drawVideo = video;
    const drawCtx = ctx;
    const readCtx = sampleCtx;
    let animationFrame = 0;

    function draw() {
      const rect = drawCanvas.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      const dpr = window.devicePixelRatio || 1;

      if (drawCanvas.width !== Math.floor(width * dpr) || drawCanvas.height !== Math.floor(height * dpr)) {
        drawCanvas.width = Math.floor(width * dpr);
        drawCanvas.height = Math.floor(height * dpr);
      }

      drawCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawCtx.fillStyle = "#050504";
      drawCtx.fillRect(0, 0, width, height);

      const videoWidth = drawVideo.videoWidth;
      const videoHeight = drawVideo.videoHeight;
      if (!videoWidth || !videoHeight) {
        animationFrame = requestAnimationFrame(draw);
        return;
      }

      const cols = Math.max(1, Math.ceil(width / cellSize));
      const rows = Math.max(1, Math.ceil(height / cellSize));
      if (sampleCanvas.width !== cols || sampleCanvas.height !== rows) {
        sampleCanvas.width = cols;
        sampleCanvas.height = rows;
      }

      const targetAspect = cols / rows;
      const videoAspect = videoWidth / videoHeight;
      let sx = 0;
      let sy = 0;
      let sw = videoWidth;
      let sh = videoHeight;

      if (videoAspect > targetAspect) {
        sw = videoHeight * targetAspect;
        sx = (videoWidth - sw) / 2;
      } else {
        sh = videoWidth / targetAspect;
        sy = (videoHeight - sh) / 2;
      }

      readCtx.save();
      readCtx.translate(cols, 0);
      readCtx.scale(-1, 1);
      readCtx.drawImage(drawVideo, sx, sy, sw, sh, 0, 0, cols, rows);
      readCtx.restore();

      const pixels = readCtx.getImageData(0, 0, cols, rows).data;
      drawCtx.textAlign = "center";
      drawCtx.textBaseline = "alphabetic";
      drawCtx.font = `${cellSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace`;

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const offset = (row * cols + col) * 4;
          const r = pixels[offset];
          const g = pixels[offset + 1];
          const b = pixels[offset + 2];
          const brightness = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
          const gray = Math.round(brightness * 255);
          const charIndex = Math.min(
            ASCII_RAMP.length - 1,
            Math.floor(brightness * (ASCII_RAMP.length - 1)),
          );
          const x = col * cellSize;
          const y = row * cellSize;

          if (tileOpacity > 0) {
            drawCtx.fillStyle = `rgba(${gray}, ${gray}, ${gray}, ${tileOpacity})`;
            drawCtx.fillRect(x, y, cellSize, cellSize);
          }

          drawCtx.fillStyle = `rgba(${gray}, ${gray}, ${gray}, ${textOpacity})`;
          drawCtx.fillText(ASCII_RAMP[charIndex], x + cellSize / 2, y + cellSize * 0.82);
        }
      }

      animationFrame = requestAnimationFrame(draw);
    }

    animationFrame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationFrame);
  }, [cameraState, cellSize, textOpacity, tileOpacity]);

  return (
    <main className="face-shell">
      <video ref={videoRef} className="face-video" playsInline muted />
      <canvas ref={canvasRef} className="face-canvas" aria-label="webcam rendered as colored ascii" />

      <section className="face-panel" aria-label="ascii camera settings">
        <div className="face-panel-header">
          <span>ascii face</span>
          {cameraState === "live" ? (
            <button type="button" onClick={stopCamera}>stop</button>
          ) : (
            <button type="button" onClick={startCamera} disabled={cameraState === "requesting"}>
              {cameraState === "requesting" ? "asking..." : "use webcam"}
            </button>
          )}
        </div>

        <label>
          <span>cell size {cellSize}</span>
          <input
            type="range"
            min="7"
            max="22"
            value={cellSize}
            onChange={(event) => setCellSize(Number(event.target.value))}
          />
        </label>
        <label>
          <span>text opacity {Math.round(textOpacity * 100)}</span>
          <input
            type="range"
            min="20"
            max="100"
            value={Math.round(textOpacity * 100)}
            onChange={(event) => setTextOpacity(Number(event.target.value) / 100)}
          />
        </label>
        <label>
          <span>tile opacity {Math.round(tileOpacity * 100)}</span>
          <input
            type="range"
            min="0"
            max="70"
            value={Math.round(tileOpacity * 100)}
            onChange={(event) => setTileOpacity(Number(event.target.value) / 100)}
          />
        </label>

        {error && <p className="face-error">{error}</p>}
      </section>
    </main>
  );
}
