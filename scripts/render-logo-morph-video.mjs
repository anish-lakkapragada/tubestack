import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import sharp from "sharp";

const execFileAsync = promisify(execFile);
const root = path.resolve(import.meta.dirname, "..");
const outDir = path.join(root, "experiments", "logo-morph");
const framesDir = path.join(outDir, "frames");
const width = 1920;
const height = 1080;
const fps = 30;
const seconds = 5.2;
const frames = Math.round(fps * seconds);

const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));
const lerp = (a, b, t) => a + (b - a) * t;
const stage = (time, a, b) => ease(clamp((time - a) / (b - a)));
const hex = (n) => Math.round(n).toString(16).padStart(2, "0");
const mix = (from, to, t) => {
  const a = from.match(/\w\w/g).map((x) => parseInt(x, 16));
  const b = to.match(/\w\w/g).map((x) => parseInt(x, 16));
  return `#${hex(lerp(a[0], b[0], t))}${hex(lerp(a[1], b[1], t))}${hex(lerp(a[2], b[2], t))}`;
};

function svgFrame(i) {
  const time = i / fps;
  const enter = stage(time, 0.0, 0.45);
  const lineTravel = stage(time, 0.55, 3.0);
  const bodyFade = 1 - stage(time, 0.75, 3.0);
  const youtubeOrange = stage(time, 1.45, 3.25);
  const center = stage(time, 3.45, 4.65);
  const finalSettle = center;

  const ytStart = { cx: 1275, cy: 515, w: 360, h: 230 };
  const ytEnd = { cx: 960, cy: 527, w: 448, h: 286 };
  const ytW = lerp(ytStart.w, ytEnd.w, finalSettle);
  const ytH = lerp(ytStart.h, ytEnd.h, finalSettle);
  const ytX = lerp(ytStart.cx, ytEnd.cx, center) - ytW / 2;
  const ytY = lerp(ytStart.cy, ytEnd.cy, center) - ytH / 2;
  const ytRx = lerp(52, 62, finalSettle);
  const triLeft = ytX + ytW * 0.36;
  const triTip = ytX + ytW * 0.72;
  const triCenterY = ytY + ytH * 0.5;
  const triTop = triCenterY - ytH * 0.29;
  const triBottom = triCenterY + ytH * 0.29;
  const triangle = `${triLeft},${triTop} ${triLeft},${triBottom} ${triTip},${triCenterY}`;

  const ssX = 505;
  const ssScale = 7.6;
  const cutYs = [
    triCenterY - ytH * 0.18,
    triCenterY - ytH * 0.04,
    triCenterY + ytH * 0.10,
  ];
  const ssY = cutYs[0];
  const bodyApproach = stage(time, 0.55, 2.8);
  const bodyX = lerp(ssX, 850, bodyApproach);
  const lineBaseX = lerp(ssX, 690, bodyApproach);
  const iconLeft = ssX + 1.46 * ssScale;
  const iconW = 21.08 * ssScale;
  const barH = 2.836 * ssScale;
  const fullCutW = triTip - triLeft + 8;
  const barW = lerp(iconW, fullCutW, lineTravel);
  const startYs = cutYs;
  const endYs = cutYs;
  const barX = lerp(lineBaseX + 1.46 * ssScale, triLeft - 8, lineTravel);
  const barYs = startYs;
  const lineOpacity = enter * (1 - stage(time, 2.88, 3.0));
  const baseLogoOpacity = enter * (1 - stage(time, 1.15, 2.8));
  const carveOpacity = stage(time, 3.0, 3.12);
  const creamOpacity = stage(time, 3.7, 4.55);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <clipPath id="tri"><polygon points="${triangle}"/></clipPath>
  </defs>
  <rect width="${width}" height="${height}" fill="#ffffff"/>
  <g opacity="${creamOpacity}">
    <rect x="${ytX - 24}" y="${ytY - 24}" width="${ytW + 48}" height="${ytH + 48}" rx="${ytRx + 22}" fill="#FFFDF8" stroke="#E7DFD0" stroke-width="8"/>
  </g>
  <g opacity="${baseLogoOpacity}" transform="translate(${bodyX} ${ssY}) scale(${ssScale})">
    <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" fill="#FF6719"/>
  </g>
  <rect x="${ytX}" y="${ytY}" width="${ytW}" height="${ytH}" rx="${ytRx}" fill="${mix("ff0000", "ff6719", youtubeOrange)}" opacity="${enter}"/>
  <g opacity="${lineOpacity}">
      <rect x="${barX}" y="${barYs[0]}" width="${barW}" height="${barH}" rx="1.5" fill="#FF6719"/>
      <rect x="${barX}" y="${barYs[1]}" width="${barW}" height="${barH}" rx="1.5" fill="#FF6719"/>
      <rect x="${barX}" y="${barYs[2]}" width="${barW}" height="${barH}" rx="1.5" fill="#FF6719"/>
  </g>
  <polygon points="${triangle}" fill="#FFF9F0" opacity="${enter}"/>
  <g clip-path="url(#tri)" opacity="${carveOpacity}">
    <rect x="${triLeft - 4}" y="${cutYs[0] + 2}" width="${fullCutW}" height="${ytH * 0.073}" rx="2" fill="#FF6719"/>
    <rect x="${triLeft - 4}" y="${cutYs[1] + 2}" width="${fullCutW}" height="${ytH * 0.073}" rx="2" fill="#FF6719"/>
    <rect x="${triLeft - 4}" y="${cutYs[2] + 2}" width="${fullCutW}" height="${ytH * 0.073}" rx="2" fill="#FF6719"/>
  </g>
</svg>`;
}

await fs.rm(framesDir, { recursive: true, force: true });
await fs.mkdir(framesDir, { recursive: true });
for (let i = 0; i < frames; i += 1) {
  const svg = Buffer.from(svgFrame(i));
  await sharp(svg).png().toFile(path.join(framesDir, `frame-${String(i).padStart(4, "0")}.png`));
}

const output = path.join(outDir, "tubestack-logo-morph.mp4");
await execFileAsync("ffmpeg", [
  "-y",
  "-framerate", String(fps),
  "-i", path.join(framesDir, "frame-%04d.png"),
  "-vf", "format=yuv420p",
  "-c:v", "libx264",
  "-pix_fmt", "yuv420p",
  "-movflags", "+faststart",
  output,
]);

console.log(output);
