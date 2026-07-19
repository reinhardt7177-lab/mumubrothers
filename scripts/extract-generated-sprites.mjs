import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const root = process.cwd();

const groups = [
  {
    source: "asset-sources/legacy-sheets/swamp-enemies-1.png",
    outputDir: "public/assets/monsters",
    names: ["swamp-zombie", "gator-outlaw", "poison-frog", "wisp-gunslinger"]
  },
  {
    source: "asset-sources/legacy-sheets/swamp-enemies-2.png",
    outputDir: "public/assets/monsters",
    names: ["voodoo-mask", "skeletal-ferryman", "leech-mutant", "moss-witch"]
  },
  {
    source: "asset-sources/legacy-sheets/swamp-enemies-3.png",
    outputDir: "public/assets/monsters",
    names: ["mosquito-gunslinger", "bone-alligator"]
  },
  {
    source: "asset-sources/legacy-sheets/swamp-bosses-1.png",
    outputDir: "public/assets/bosses",
    names: ["gator-king", "candle-witch", "steamboat-revenant"]
  },
  {
    source: "asset-sources/legacy-sheets/swamp-bosses-2.png",
    outputDir: "public/assets/bosses",
    names: ["bone-market-baron", "heartroot-leviathan"]
  }
];

function components(png) {
  const { width, height, data } = png;
  const seen = new Uint8Array(width * height);
  const result = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const start = y * width + x;
      if (seen[start] || data[start * 4 + 3] === 0) continue;

      const pixels = [];
      const queue = [start];
      let head = 0;
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      seen[start] = 1;

      while (head < queue.length) {
        const current = queue[head++];
        const cx = current % width;
        const cy = Math.floor(current / width);
        pixels.push(current);
        minX = Math.min(minX, cx);
        maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy);
        maxY = Math.max(maxY, cy);

        const neighbors = [current - 1, current + 1, current - width, current + width];
        for (const next of neighbors) {
          if (next < 0 || next >= width * height || seen[next]) continue;
          const nx = next % width;
          const ny = Math.floor(next / width);
          if (Math.abs(nx - cx) + Math.abs(ny - cy) !== 1) continue;
          if (data[next * 4 + 3] === 0) continue;
          seen[next] = 1;
          queue.push(next);
        }
      }

      result.push({
        pixels,
        size: pixels.length,
        minX,
        maxX,
        minY,
        maxY,
        centerX: (minX + maxX) / 2,
        centerY: (minY + maxY) / 2
      });
    }
  }

  return result;
}

function boxDistance(a, b) {
  const dx = Math.max(0, b.minX - a.maxX, a.minX - b.maxX);
  const dy = Math.max(0, b.minY - a.maxY, a.minY - b.maxY);
  return Math.hypot(dx, dy);
}

function extractGroup(group) {
  const sourcePath = path.join(root, group.source);
  const png = PNG.sync.read(fs.readFileSync(sourcePath));
  const all = components(png);
  const subjects = [...all]
    .sort((a, b) => b.size - a.size)
    .slice(0, group.names.length)
    .sort((a, b) => a.centerX - b.centerX);

  if (subjects.length !== group.names.length) {
    throw new Error(`Could not find ${group.names.length} subjects in ${group.source}`);
  }

  const assignments = subjects.map((subject) => [subject]);
  for (const component of all) {
    if (subjects.includes(component) || component.size < 2) continue;
    let nearest = -1;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (let index = 0; index < subjects.length; index += 1) {
      const distance = boxDistance(component, subjects[index]);
      if (distance < nearestDistance) {
        nearest = index;
        nearestDistance = distance;
      }
    }
    if (nearest >= 0 && nearestDistance <= 72) assignments[nearest].push(component);
  }

  const outputDir = path.join(root, group.outputDir);
  fs.mkdirSync(outputDir, { recursive: true });

  return assignments.map((parts, index) => {
    const padding = 8;
    const minX = Math.max(0, Math.min(...parts.map((part) => part.minX)) - padding);
    const maxX = Math.min(png.width - 1, Math.max(...parts.map((part) => part.maxX)) + padding);
    const minY = Math.max(0, Math.min(...parts.map((part) => part.minY)) - padding);
    const maxY = Math.min(png.height - 1, Math.max(...parts.map((part) => part.maxY)) + padding);
    const output = new PNG({ width: maxX - minX + 1, height: maxY - minY + 1, colorType: 6 });
    output.data.fill(0);

    for (const part of parts) {
      for (const sourceIndex of part.pixels) {
        const sourceX = sourceIndex % png.width;
        const sourceY = Math.floor(sourceIndex / png.width);
        const targetIndex = ((sourceY - minY) * output.width + sourceX - minX) * 4;
        const sourceOffset = sourceIndex * 4;
        output.data[targetIndex] = png.data[sourceOffset];
        output.data[targetIndex + 1] = png.data[sourceOffset + 1];
        output.data[targetIndex + 2] = png.data[sourceOffset + 2];
        output.data[targetIndex + 3] = png.data[sourceOffset + 3];
      }
    }

    const name = group.names[index];
    const outputPath = path.join(outputDir, `${name}.png`);
    fs.writeFileSync(outputPath, PNG.sync.write(output));
    return { name, width: output.width, height: output.height, output: path.relative(root, outputPath) };
  });
}

const manifest = groups.flatMap(extractGroup);
console.log(JSON.stringify(manifest, null, 2));
