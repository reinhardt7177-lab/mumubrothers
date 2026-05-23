import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const root = process.cwd();
const sourcePath = path.join(root, "asset-sources", "enemy-types.png");
const source = PNG.sync.read(fs.readFileSync(sourcePath));
const cellSize = 512;

const sourceFrames = {
  maskedOutlaw: { x: 18, y: 56, w: 280, h: 388 },
  rifleDesperado: { x: 322, y: 56, w: 296, h: 388 },
  cactusMutant: { x: 600, y: 36, w: 348, h: 426 },
  scorpionBandit: { x: 886, y: 58, w: 356, h: 386 },
  ghostMiner: { x: 1224, y: 54, w: 284, h: 392 },
  dynamiteThrower: { x: 18, y: 566, w: 282, h: 384 },
  trainRobber: { x: 320, y: 572, w: 292, h: 374 },
  armoredSheriff: { x: 586, y: 530, w: 366, h: 432 },
  vampireCowboy: { x: 900, y: 546, w: 338, h: 412 },
  demonOutlaw: { x: 1190, y: 508, w: 330, h: 456 }
};

const groups = [
  ["maskedOutlaw", "rifleDesperado", "cactusMutant", "scorpionBandit"],
  ["ghostMiner", "dynamiteThrower", "trainRobber", "armoredSheriff"],
  ["vampireCowboy", "demonOutlaw"]
];

const manifest = {};

for (const [groupIndex, names] of groups.entries()) {
  const rows = Math.ceil(names.length / 2);
  const sheet = new PNG({ width: cellSize * 2, height: cellSize * rows, colorType: 6 });
  sheet.data.fill(0);
  const texture = `enemyTypes${groupIndex + 1}`;

  for (const [index, name] of names.entries()) {
    const frame = sourceFrames[name];
    const col = index % 2;
    const row = Math.floor(index / 2);
    const dx = col * cellSize + Math.floor((cellSize - frame.w) / 2);
    const dy = row * cellSize + Math.floor((cellSize - frame.h) / 2);

    PNG.bitblt(source, sheet, frame.x, frame.y, frame.w, frame.h, dx, dy);
    manifest[name] = { texture, x: dx, y: dy, w: frame.w, h: frame.h };
  }

  const outputPath = path.join(root, "public", "assets", `enemy-types-${groupIndex + 1}.png`);
  fs.writeFileSync(outputPath, PNG.sync.write(sheet));
}

console.log(JSON.stringify(manifest, null, 2));
