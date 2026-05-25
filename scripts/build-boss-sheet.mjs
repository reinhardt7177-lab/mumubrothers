import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const root = process.cwd();
const assets = path.join(root, "public", "assets");
const cell = 640;
const columns = 3;

const enemyFrames = {
  cactusMutant: { texture: "enemy-types-1.png", x: 82, y: 555, w: 348, h: 426 },
  ghostMiner: { texture: "enemy-types-2.png", x: 114, y: 60, w: 284, h: 392 },
  armoredSheriff: { texture: "enemy-types-2.png", x: 585, y: 552, w: 366, h: 432 },
  demonOutlaw: { texture: "enemy-types-3.png", x: 603, y: 28, w: 330, h: 456 }
};

const bosses = [
  ["marshalBragg", "armoredSheriff"],
  ["cactusJack", "cactusMutant"],
  ["ironBelle", "armoredSheriff"],
  ["coalBaron", "ghostMiner"],
  ["lastBrother", "demonOutlaw"]
];

const sources = new Map();
const sheet = new PNG({ width: columns * cell, height: Math.ceil(bosses.length / columns) * cell, colorType: 6 });
sheet.data.fill(0);
const manifest = {};

function getSource(file) {
  if (!sources.has(file)) sources.set(file, PNG.sync.read(fs.readFileSync(path.join(assets, file))));
  return sources.get(file);
}

function copyScaled(source, frame, target, dx, dy, dw, dh) {
  for (let y = 0; y < dh; y += 1) {
    const sy = frame.y + Math.min(frame.h - 1, Math.floor((y / dh) * frame.h));
    for (let x = 0; x < dw; x += 1) {
      const sx = frame.x + Math.min(frame.w - 1, Math.floor((x / dw) * frame.w));
      const srcIdx = (sy * source.width + sx) * 4;
      const dstIdx = ((dy + y) * target.width + (dx + x)) * 4;
      target.data[dstIdx] = source.data[srcIdx];
      target.data[dstIdx + 1] = source.data[srcIdx + 1];
      target.data[dstIdx + 2] = source.data[srcIdx + 2];
      target.data[dstIdx + 3] = source.data[srcIdx + 3];
    }
  }
}

for (const [index, [bossName, sourceName]] of bosses.entries()) {
  const frame = enemyFrames[sourceName];
  const source = getSource(frame.texture);
  const scale = Math.min((cell - 104) / frame.w, (cell - 92) / frame.h);
  const dw = Math.round(frame.w * scale);
  const dh = Math.round(frame.h * scale);
  const col = index % columns;
  const row = Math.floor(index / columns);
  const dx = col * cell + Math.floor((cell - dw) / 2);
  const dy = row * cell + Math.floor((cell - dh) / 2);
  copyScaled(source, frame, sheet, dx, dy, dw, dh);
  manifest[bossName] = { texture: "bossTypes", x: dx, y: dy, w: dw, h: dh };
}

fs.writeFileSync(path.join(assets, "boss-types.png"), PNG.sync.write(sheet));
console.log(JSON.stringify(manifest, null, 2));
