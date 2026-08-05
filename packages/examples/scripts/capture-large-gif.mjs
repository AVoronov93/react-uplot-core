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

const VIEWPORT = { width: 820, height: 620 };
const PALETTE_COLORS = 96;
const FPS = 30;
const FRAME_MS = 1000 / FPS;
const GIF_DELAY_MS = 30; // → 3cs ≈ 33fps
const STATIC_FRAMES = 20;
/** Longer clip so the slow pan is visible and calm. */
const DYNAMIC_FRAMES = 90;

const POINT_CANDIDATES = [10_000_000, 5_000_000, 2_000_000, 1_000_000];

async function encodeGif(frames, outFile) {
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
		gif.writeFrame(index, width, height, { palette, delay: GIF_DELAY_MS, dispose: 2 });
	}
	gif.finish();
	await mkdir(outDir, { recursive: true });
	const bytes = Buffer.from(gif.bytes());
	await writeFile(outFile, bytes);
	return { width, height, bytes: bytes.length, frames: frames.length };
}

async function captureFrames(locator, count, gapMs) {
	const frames = [];
	const hashes = new Set();
	for (let i = 0; i < count; i++) {
		const buf = await locator.screenshot({ type: "png" });
		hashes.add(createHash("sha1").update(buf).digest("hex"));
		frames.push(buf);
		if (gapMs > 0) await new Promise((r) => setTimeout(r, gapMs));
	}
	return { frames, unique: hashes.size };
}

async function tryLoad(page, points) {
	await page.goto(`http://127.0.0.1:5199/?points=${points}#large`, {
		waitUntil: "domcontentloaded",
		timeout: 60_000,
	});
	await page.getByTestId("large-panel").waitFor({ timeout: 30_000 });
	await page.getByTestId("large-ready").waitFor({ timeout: 180_000 });
	// Let uPlot finish first paint / path build.
	await page.waitForTimeout(800);
	const label = await page.getByTestId("large-points").textContent();
	const mount = await page.getByTestId("large-mount").textContent();
	return { label, mount };
}

async function main() {
	const server = await createServer({
		root: examplesRoot,
		configFile: path.join(examplesRoot, "vite.config.ts"),
		server: { port: 5199, strictPort: true, host: "127.0.0.1" },
	});
	await server.listen();

	const browser = await chromium.launch({
		args: ["--disable-dev-shm-usage"],
	});
	const page = await browser.newPage({
		viewport: VIEWPORT,
		deviceScaleFactor: 1,
	});
	page.setDefaultTimeout(180_000);

	try {
		let loaded = null;
		let usedPoints = POINT_CANDIDATES[0];
		for (const points of POINT_CANDIDATES) {
			try {
				console.log(`Trying ${points.toLocaleString("en-US")} points…`);
				loaded = await tryLoad(page, points);
				usedPoints = points;
				console.log(`Ready: points=${loaded.label}, mount=${loaded.mount}ms`);
				break;
			} catch (err) {
				console.warn(`Failed at ${points}:`, err instanceof Error ? err.message : err);
			}
		}
		if (!loaded) {
			throw new Error("Could not mount large-data demo at any candidate size");
		}

		const panel = page.getByTestId("large-panel");

		// --- static overview ---
		await page.getByTestId("large-static").click();
		await page.waitForTimeout(400);
		const staticShot = await captureFrames(panel, STATIC_FRAMES, FRAME_MS);
		const staticPath = path.join(outDir, "large-static.gif");
		const staticInfo = await encodeGif(staticShot.frames, staticPath);
		console.log(
			`Wrote ${staticPath} (${staticInfo.width}x${staticInfo.height}, ${staticInfo.frames} frames, ${(staticInfo.bytes / 1024).toFixed(0)}KB)`,
		);

		// --- dynamic zoom (slow pan) ---
		await page.getByTestId("large-dynamic").click();
		await page.waitForTimeout(500);
		const dynamicShot = await captureFrames(panel, DYNAMIC_FRAMES, FRAME_MS);
		if (dynamicShot.unique < 15) {
			throw new Error(`Dynamic zoom looks static (${dynamicShot.unique} unique frames)`);
		}
		const dynamicPath = path.join(outDir, "large-dynamic.gif");
		const dynamicInfo = await encodeGif(dynamicShot.frames, dynamicPath);
		console.log(
			`Wrote ${dynamicPath} (${dynamicInfo.width}x${dynamicInfo.height}, ${dynamicInfo.frames} frames, ${dynamicShot.unique} unique, ${(dynamicInfo.bytes / 1024).toFixed(0)}KB)`,
		);

		await writeFile(
			path.join(outDir, "large-data.json"),
			`${JSON.stringify(
				{
					points: usedPoints,
					pointsLabel: loaded.label,
					mountMs: loaded.mount,
					static: staticInfo,
					dynamic: { ...dynamicInfo, unique: dynamicShot.unique },
					generatedAt: new Date().toISOString(),
				},
				null,
				2,
			)}\n`,
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
