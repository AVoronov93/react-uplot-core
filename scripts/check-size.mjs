import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distJs = path.join(root, "packages/react/dist/index.js");

// Soft budget until first real build artifacts exist.
const MAX_BYTES = 32_000;

if (!existsSync(distJs)) {
	console.log("size check skipped — packages/react/dist not built yet");
	process.exit(0);
}

const bytes = readFileSync(distJs).byteLength;
console.log(`@ruplot/react ESM size: ${bytes} bytes (budget ${MAX_BYTES})`);

if (bytes > MAX_BYTES) {
	console.error("Bundle size exceeds budget");
	process.exit(1);
}
