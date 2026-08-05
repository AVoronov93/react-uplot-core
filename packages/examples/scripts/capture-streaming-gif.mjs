import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import gifenc from "gifenc";
import pngjs from "pngjs";
import { createServer } from "vite";

const { GIFEncoder, quantize, applyPalette } = gifenc;
const { PNG } = pngjs;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const examplesRoot = path.resolve(__dirname, "..");
const outDir = path.resolve(examplesRoot, "../../docs/media");
const outFile = path.join(outDir, "streaming.gif");

/** 30fps — exact GIF match: 3 centiseconds = 30ms. */
const TARGET_FPS = 30;
const FRAME_MS = 1000 / TARGET_FPS;
const DURATION_SEC = 2.5;
const FRAME_COUNT = Math.round(TARGET_FPS * DURATION_SEC);
/** gifenc: Math.round(ms/10) → 3cs = 30ms = 30fps. */
const GIF_DELAY_MS = 30;
const VIEWPORT = { width: 800, height: 560 };
const PALETTE_COLORS = 96;

async function pace(startedAt, frameIndex) {
	const target = startedAt + frameIndex * FRAME_MS;
	const wait = target - performance.now();
	if (wait > 0) {
		await new Promise((r) => setTimeout(r, wait));
	}
}

async function main() {
	const server = await createServer({
		root: examplesRoot,
		configFile: path.join(examplesRoot, "vite.config.ts"),
		server: { port: 5199, strictPort: true, host: "127.0.0.1" },
	});
	await server.listen();

	const browser = await chromium.launch();
	const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });

	try {
		await page.goto("http://127.0.0.1:5199/#streaming", { waitUntil: "networkidle" });
		await page.getByTestId("streaming-panel").waitFor();
		await page.waitForTimeout(900);

		const frames = [];
		const hashes = new Set();
		const target = page.getByTestId("streaming-panel");
		const startedAt = performance.now();

		for (let i = 0; i < FRAME_COUNT; i++) {
			await pace(startedAt, i);
			const buf = await target.screenshot({ type: "png" });
			hashes.add(createHash("sha1").update(buf).digest("hex"));
			frames.push(buf);
		}

		if (hashes.size < Math.floor(FRAME_COUNT * 0.5)) {
			throw new Error(
				`Too few unique frames (${hashes.size}/${FRAME_COUNT}). Streaming may be stalled.`,
			);
		}

		const decoded = frames.map((frame) => PNG.sync.read(frame));
		const { width, height } = decoded[0];

		const sampleEvery = Math.max(1, Math.floor(decoded.length / 8));
		const samplePixels = [];
		for (let i = 0; i < decoded.length; i += sampleEvery) {
			const data = decoded[i].data;
			for (let p = 0; p < data.length; p++) samplePixels.push(data[p]);
		}
		const palette = quantize(Uint8Array.from(samplePixels), PALETTE_COLORS);

		const gif = GIFEncoder();
		for (const png of decoded) {
			const index = applyPalette(png.data, palette);
			gif.writeFrame(index, width, height, {
				palette,
				delay: GIF_DELAY_MS,
				dispose: 2,
			});
		}
		gif.finish();

		await mkdir(outDir, { recursive: true });
		const bytes = Buffer.from(gif.bytes());
		await writeFile(outFile, bytes);

		const centi = Math.round(GIF_DELAY_MS / 10);
		const elapsedSec = ((performance.now() - startedAt) / 1000).toFixed(2);
		console.log(
			`Wrote ${outFile} (${width}x${height}, ${frames.length} frames, ${hashes.size} unique, delay=${GIF_DELAY_MS}ms→${centi}cs≈${(100 / centi).toFixed(0)}fps, capture=${elapsedSec}s, ${(bytes.length / 1024).toFixed(0)}KB)`,
		);
	} finally {
		await browser.close();
		await server.close();
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
