import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const root = process.cwd();
const directories = ["public/assets/monsters", "public/assets/bosses"];
const expectedCounts = new Map([
  ["public/assets/monsters", 10],
  ["public/assets/bosses", 5]
]);

for (const directory of directories) {
  const absoluteDirectory = path.join(root, directory);
  const files = fs.readdirSync(absoluteDirectory).filter((file) => file.endsWith(".png"));
  const expected = expectedCounts.get(directory);
  if (files.length !== expected) throw new Error(`${directory}: expected ${expected} PNGs, found ${files.length}`);

  for (const file of files) {
    const png = PNG.sync.read(fs.readFileSync(path.join(absoluteDirectory, file)));
    let opaquePixels = 0;
    let borderPixels = 0;

    for (let y = 0; y < png.height; y += 1) {
      for (let x = 0; x < png.width; x += 1) {
        const alpha = png.data[(y * png.width + x) * 4 + 3];
        if (alpha === 0) continue;
        opaquePixels += 1;
        if (x === 0 || y === 0 || x === png.width - 1 || y === png.height - 1) borderPixels += 1;
      }
    }

    const coverage = opaquePixels / (png.width * png.height);
    if (opaquePixels === 0) throw new Error(`${file}: no visible sprite pixels`);
    if (borderPixels > 0) throw new Error(`${file}: ${borderPixels} opaque pixels touch the image border`);
    if (coverage < 0.08 || coverage > 0.9) throw new Error(`${file}: implausible sprite coverage ${coverage.toFixed(3)}`);
  }
}

const readPng = (relativePath) => PNG.sync.read(fs.readFileSync(path.join(root, relativePath)));

const visibleCoverage = (png, x0 = 0, y0 = 0, width = png.width, height = png.height) => {
  let visible = 0;
  for (let y = y0; y < y0 + height; y += 1) {
    for (let x = x0; x < x0 + width; x += 1) {
      if (png.data[(y * png.width + x) * 4 + 3] > 8) visible += 1;
    }
  }
  return visible / (width * height);
};

const assertTransparentBorder = (relativePath, png) => {
  let visibleBorder = 0;
  for (let x = 0; x < png.width; x += 1) {
    if (png.data[x * 4 + 3] > 8) visibleBorder += 1;
    if (png.data[((png.height - 1) * png.width + x) * 4 + 3] > 8) visibleBorder += 1;
  }
  for (let y = 1; y < png.height - 1; y += 1) {
    if (png.data[(y * png.width) * 4 + 3] > 8) visibleBorder += 1;
    if (png.data[(y * png.width + png.width - 1) * 4 + 3] > 8) visibleBorder += 1;
  }
  if (visibleBorder > 0) throw new Error(`${relativePath}: ${visibleBorder} visible pixels touch the image border`);
};

for (const backgroundPath of [
  "public/assets/phase4/dream-bedroom-stage.png",
  "public/assets/phase4/stage2-star-toyworks-v1.png",
  "public/assets/phase4/stage3-cloud-library-v1.png",
  "public/assets/phase4/stage4-starwhale-harbor-v1.png"
]) {
  const background = readPng(backgroundPath);
  const backgroundRatio = background.width / background.height;
  if (background.width < 1600 || Math.abs(backgroundRatio - 16 / 9) > 0.03) {
    throw new Error(`${backgroundPath}: must be a production 16:9 image, got ${background.width}x${background.height}`);
  }
}

const quadrantSheets = [
  "public/assets/phase4/blue-mumu-poses.png",
  "public/assets/phase4/red-mumu-poses.png",
  "public/assets/phase4/glitch-toys.png",
  "public/assets/phase4/dream-parts.png",
  "public/assets/phase4/enemy-projectiles.png",
  "public/assets/phase4/workbench-upgrades-v2.png",
  "public/assets/phase4/stage2-toys-v1.png",
  "public/assets/phase4/stage3-storybook-toys-v1.png",
  "public/assets/phase4/stage4-postal-enemies-v1.png"
];
for (const relativePath of quadrantSheets) {
  const png = readPng(relativePath);
  if (png.width % 2 !== 0 || png.height % 2 !== 0) throw new Error(`${relativePath}: 2x2 sheet dimensions must be even`);
  assertTransparentBorder(relativePath, png);
  const quadrantWidth = png.width / 2;
  const quadrantHeight = png.height / 2;
  for (let row = 0; row < 2; row += 1) {
    for (let column = 0; column < 2; column += 1) {
      const coverage = visibleCoverage(png, column * quadrantWidth, row * quadrantHeight, quadrantWidth, quadrantHeight);
      if (coverage < 0.04 || coverage > 0.72) {
        throw new Error(`${relativePath}: quadrant ${row * 2 + column + 1} has implausible coverage ${coverage.toFixed(3)}`);
      }
    }
  }
}

const consumableSheetPath = "public/assets/phase4/workbench-consumables-v2.png";
const consumableSheet = readPng(consumableSheetPath);
if (consumableSheet.width % 2 !== 0 || consumableSheet.height % 2 !== 0) {
  throw new Error(`${consumableSheetPath}: 2x2 sheet dimensions must be even`);
}
assertTransparentBorder(consumableSheetPath, consumableSheet);
const consumableWidth = consumableSheet.width / 2;
const consumableHeight = consumableSheet.height / 2;
for (let quadrant = 0; quadrant < 4; quadrant += 1) {
  const coverage = visibleCoverage(
    consumableSheet,
    (quadrant % 2) * consumableWidth,
    Math.floor(quadrant / 2) * consumableHeight,
    consumableWidth,
    consumableHeight
  );
  if (quadrant < 3 && (coverage < 0.04 || coverage > 0.72)) {
    throw new Error(`${consumableSheetPath}: item quadrant ${quadrant + 1} has implausible coverage ${coverage.toFixed(3)}`);
  }
  if (quadrant === 3 && coverage > 0.01) {
    throw new Error(`${consumableSheetPath}: empty quadrant contains visible pixels ${coverage.toFixed(3)}`);
  }
}

for (const relativePath of [
  "public/assets/phase4/nightmare-toymaster.png",
  "public/assets/phase4/stage2-gear-master-v1.png",
  "public/assets/phase4/stage3-ink-librarian-v1.png",
  "public/assets/phase4/stage4-tempest-admiral-v1.png",
  "public/assets/phase4/dream-cover.png"
]) {
  const png = readPng(relativePath);
  assertTransparentBorder(relativePath, png);
  const coverage = visibleCoverage(png);
  if (coverage < 0.08 || coverage > 0.78) throw new Error(`${relativePath}: implausible cutout coverage ${coverage.toFixed(3)}`);
}

console.log("Validated legacy cutouts and Phase 4 background, four-slot sheets, workbench items, projectiles, boss, and cover.");
