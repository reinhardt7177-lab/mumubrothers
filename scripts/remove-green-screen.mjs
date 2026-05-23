import fs from "node:fs";
import { PNG } from "pngjs";

const [input, output] = process.argv.slice(2);

if (!input || !output) {
  throw new Error("Usage: node scripts/remove-green-screen.mjs <input.png> <output.png>");
}

const png = PNG.sync.read(fs.readFileSync(input));

for (let y = 0; y < png.height; y += 1) {
  for (let x = 0; x < png.width; x += 1) {
    const idx = (png.width * y + x) << 2;
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    const greenScore = g - Math.max(r, b);
    const isFlatGreenScreen = g > 58 && g > r * 1.55 && g > b * 1.55 && Math.abs(r - b) < 28;

    if ((g > 95 && greenScore > 34 && Math.abs(r - b) < 34) || isFlatGreenScreen) {
      png.data[idx + 3] = 0;
      png.data[idx] = Math.round(r * 0.7);
      png.data[idx + 1] = Math.round(g * 0.35);
      png.data[idx + 2] = Math.round(b * 0.7);
    }
  }
}

fs.writeFileSync(output, PNG.sync.write(png));
