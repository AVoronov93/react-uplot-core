import { describe, expect, it, vi } from "vitest";
import { createDataWorker } from "./create-data-worker.js";
import { probeOffscreenCanvas } from "./offscreen-probe.js";
import { streamingWindowTransferable } from "./window.js";

describe("streamingWindowTransferable", () => {
	it("appends and trims", () => {
		const buffer = [Float64Array.from([0, 1, 2]), Float64Array.from([10, 11, 12])];
		const chunk = [Float64Array.from([3, 4]), Float64Array.from([13, 14])];
		const next = streamingWindowTransferable({ buffer, chunk, capacity: 4 });
		expect([...next[0]!]).toEqual([1, 2, 3, 4]);
		expect([...next[1]!]).toEqual([11, 12, 13, 14]);
	});
});

describe("probeOffscreenCanvas", () => {
	it("reports uPlot DOM coupling", () => {
		const result = probeOffscreenCanvas({} as typeof globalThis);
		expect(result.uplotDomCoupled).toBe(true);
		expect(result.notes.length).toBeGreaterThan(0);
	});
});

describe("createDataWorker", () => {
	it("round-trips window via mock Worker", async () => {
		const listeners = new Map<string, Set<(ev: MessageEvent) => void>>();
		const worker = {
			onmessage: null as ((ev: MessageEvent) => void) | null,
			onerror: null as ((ev: ErrorEvent) => void) | null,
			postMessage(data: unknown) {
				const msg = data as {
					id: number;
					type: string;
					buffer?: Float64Array[];
					chunk?: Float64Array[];
					capacity?: number;
				};
				queueMicrotask(() => {
					if (msg.type === "ping") {
						worker.onmessage?.({ data: { id: msg.id, type: "pong" } } as MessageEvent);
						return;
					}
					if (msg.type === "window") {
						const columns = streamingWindowTransferable({
							buffer: msg.buffer!,
							chunk: msg.chunk!,
							capacity: msg.capacity!,
						});
						worker.onmessage?.({
							data: { id: msg.id, type: "window", columns },
						} as MessageEvent);
					}
				});
			},
			terminate: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		} as unknown as Worker;

		const client = createDataWorker(worker);
		await client.ping();
		const columns = await client.window({
			buffer: [Float64Array.from([0, 1]), Float64Array.from([2, 3])],
			chunk: [Float64Array.from([2]), Float64Array.from([4])],
			capacity: 3,
		});
		expect([...columns[0]!]).toEqual([0, 1, 2]);
		client.terminate();
		void listeners;
	});
});
