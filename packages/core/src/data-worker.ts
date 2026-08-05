import { streamingWindowTransferable } from "./data.js";

/**
 * Wire protocol for a sliding-window data Worker.
 * Apps construct `new Worker(new URL("./aligned-data.worker.ts", import.meta.url), { type: "module" })`
 * (Vite) and pass it to {@link createDataWorker}. The worker body should call
 * {@link streamingWindowTransferable} — see `@ruplot/experiments` for a reference worker.
 */
export type DataWorkerRequest =
	| { id: number; type: "ping" }
	| {
			id: number;
			type: "window";
			buffer: Float64Array[];
			chunk: Float64Array[];
			capacity: number;
	  };

export type DataWorkerResponse =
	| { id: number; type: "pong" }
	| { id: number; type: "window"; columns: Float64Array[] }
	| { id: number; type: "error"; message: string };

export type DataWorkerClient = {
	/** Append chunk into a sliding window off the main thread (transferable). */
	window: (args: {
		buffer: Float64Array[];
		chunk: Float64Array[];
		capacity: number;
	}) => Promise<Float64Array[]>;
	ping: () => Promise<void>;
	terminate: () => void;
};

/**
 * Main-thread client for a sliding-window data Worker.
 *
 * WHY: heavy window concat/slice can steal frames from uPlot paint.
 * Transferable Float64Array keeps copies off the React render path.
 *
 * Constructing `new Worker(new URL(...))` requires a bundler that understands
 * worker URLs (Vite). Unit tests can use {@link streamingWindowTransferable} directly.
 */
export function createDataWorker(worker: Worker): DataWorkerClient {
	let seq = 0;
	const pending = new Map<
		number,
		{ resolve: (value: DataWorkerResponse) => void; reject: (err: Error) => void }
	>();

	worker.onmessage = (event: MessageEvent<DataWorkerResponse>) => {
		const msg = event.data;
		const wait = pending.get(msg.id);
		if (!wait) return;
		pending.delete(msg.id);
		if (msg.type === "error") {
			wait.reject(new Error(msg.message));
			return;
		}
		wait.resolve(msg);
	};

	worker.onerror = (event) => {
		for (const [, wait] of pending) {
			wait.reject(new Error(event.message || "data worker error"));
		}
		pending.clear();
	};

	const send = <T extends Omit<DataWorkerRequest, "id">>(
		body: T,
		transfer: Transferable[] = [],
	) => {
		const id = ++seq;
		const req = { ...body, id } as DataWorkerRequest;
		return new Promise<DataWorkerResponse>((resolve, reject) => {
			pending.set(id, { resolve, reject });
			worker.postMessage(req, transfer);
		});
	};

	return {
		async ping() {
			const res = await send({ type: "ping" });
			if (res.type !== "pong") throw new Error("unexpected ping response");
		},
		async window({ buffer, chunk, capacity }) {
			const transfer = [...buffer, ...chunk].map((c) => c.buffer);
			const res = await send(
				{ type: "window", buffer, chunk, capacity } satisfies Omit<
					Extract<DataWorkerRequest, { type: "window" }>,
					"id"
				>,
				transfer,
			);
			if (res.type !== "window") throw new Error("unexpected window response");
			return res.columns;
		},
		terminate() {
			worker.terminate();
			pending.clear();
		},
	};
}

/** @deprecated Prefer importing from `@ruplot/core` — kept for local worker scripts. */
export { streamingWindowTransferable };
