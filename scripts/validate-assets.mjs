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

console.log("Validated 10 monster and 5 boss cutouts.");
