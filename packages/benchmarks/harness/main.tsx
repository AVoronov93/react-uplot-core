import { createAdapter } from "./adapters";
import type { ChartAdapter } from "./adapters/types";
import { advanceStream, makeData, makeOptions } from "./shared/data";
import { type BenchApi, type CompetitorId, summarize } from "./shared/types";
import "uplot/dist/uPlot.min.css";

const host = document.createElement("div");
host.id = "chart-host";
host.style.width = "800px";
host.style.height = "320px";
document.getElementById("root")!.appendChild(host);

let reactCommits = 0;
let adapter: ChartAdapter | null = null;
let dispose: (() => void) | null = null;
let currentData = makeData();
let currentOptions = makeOptions();

function onCommit() {
	reactCommits += 1;
}

async function waitFrame(): Promise<void> {
	await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

async function settle(): Promise<void> {
	await waitFrame();
	await waitFrame();
}

function getHeapMb(): number | null {
	const perf = performance as Performance & { memory?: { usedJSHeapSize: number } };
	if (!perf.memory) return null;
	return perf.memory.usedJSHeapSize / (1024 * 1024);
}

async function remount(id: CompetitorId): Promise<void> {
	dispose?.();
	dispose = null;
	adapter = createAdapter(id, onCommit);
	currentData = makeData();
	currentOptions = makeOptions();
	const maybeDispose = await adapter.mount({
		host,
		options: currentOptions,
		data: currentData,
	});
	dispose = maybeDispose;
	await settle();
}

async function runTimed(fn: () => void | Promise<void>): Promise<number> {
	const t0 = performance.now();
	await fn();
	return performance.now() - t0;
}

const api: BenchApi = {
	ready: true,
	async setCompetitor(id) {
		reactCommits = 0;
		await remount(id);
	},
	async runMount(runs) {
		const samples: number[] = [];
		const id = adapter?.id ?? "baseline";
		for (let i = 0; i < runs; i++) {
			dispose?.();
			adapter = createAdapter(id, onCommit);
			currentData = makeData(undefined, i + 1);
			currentOptions = makeOptions();
			const ms = await runTimed(async () => {
				const maybeDispose = await adapter!.mount({
					host,
					options: currentOptions,
					data: currentData,
				});
				dispose = maybeDispose;
				// Include layout/effects so React wrappers are measured fairly.
				await settle();
			});
			samples.push(ms);
		}
		return summarize("mount", samples, { reactCommits });
	},
	async runUpdate(runs) {
		const samples: number[] = [];
		const startCommits = reactCommits;
		for (let i = 0; i < runs; i++) {
			const next = makeData(undefined, 100 + i);
			const ms = await runTimed(async () => {
				adapter!.updateData(next, false);
				currentData = next;
				await settle();
			});
			samples.push(ms);
		}
		return summarize("update", samples, { reactCommits: reactCommits - startCommits });
	},
	async runStream(hz, durationMs) {
		const startCommits = reactCommits;
		const heapBefore = getHeapMb();
		let frames = 0;
		let tick = 0;
		const frameBudget = 1000 / hz;
		const t0 = performance.now();

		await new Promise<void>((resolve) => {
			let last = t0;
			const step = (now: number) => {
				if (now - t0 >= durationMs) {
					resolve();
					return;
				}
				if (now - last >= frameBudget * 0.9) {
					tick += 1;
					currentData = advanceStream(currentData, tick);
					adapter!.updateData(currentData, false);
					frames += 1;
					last = now;
				}
				requestAnimationFrame(step);
			};
			requestAnimationFrame(step);
		});

		const elapsed = performance.now() - t0;
		const fps = (frames / elapsed) * 1000;
		const heapAfter = getHeapMb();
		const heapDeltaMb =
			heapBefore != null && heapAfter != null ? heapAfter - heapBefore : undefined;

		return summarize("stream-60", [elapsed], {
			fps,
			reactCommits: reactCommits - startCommits,
			...(heapDeltaMb === undefined ? {} : { heapDeltaMb }),
		});
	},
	async runResize(runs) {
		const samples: number[] = [];
		const startCommits = reactCommits;
		for (let i = 0; i < runs; i++) {
			const width = 700 + (i % 5) * 20;
			const height = 280 + (i % 3) * 10;
			const ms = await runTimed(async () => {
				adapter!.setSize(width, height);
				await settle();
			});
			samples.push(ms);
		}
		return summarize("resize", samples, { reactCommits: reactCommits - startCommits });
	},
	async runZoom(runs) {
		const samples: number[] = [];
		const startCommits = reactCommits;
		for (let i = 0; i < runs; i++) {
			const min = i * 10;
			const max = min + 200;
			const ms = await runTimed(async () => {
				adapter!.setScale("x", min, max);
				await settle();
			});
			samples.push(ms);
		}
		return summarize("zoom", samples, { reactCommits: reactCommits - startCommits });
	},
	async runCursor(runs) {
		const samples: number[] = [];
		const startCommits = reactCommits;
		for (let i = 0; i < runs; i++) {
			const ms = await runTimed(() => {
				adapter!.setCursor(40 + (i % 200), 20 + (i % 100));
			});
			samples.push(ms);
		}
		return summarize("cursor", samples, { reactCommits: reactCommits - startCommits });
	},
	getReactCommits: () => reactCommits,
	resetReactCommits: () => {
		reactCommits = 0;
	},
	getHeapMb,
};

window.__RUPLOT_BENCH__ = api;

document.title = "ruplot benchmarks ready";
