/// <reference lib="webworker" />
import { streamingWindowTransferable } from "./window.js";

export type WorkerRequest =
	| {
			id: number;
			type: "window";
			buffer: Float64Array[];
			chunk: Float64Array[];
			capacity: number;
	  }
	| { id: number; type: "ping" };

export type WorkerResponse =
	| { id: number; type: "window"; columns: Float64Array[] }
	| { id: number; type: "pong" }
	| { id: number; type: "error"; message: string };

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (event: MessageEvent<WorkerRequest>) => {
	const msg = event.data;
	try {
		if (msg.type === "ping") {
			const res: WorkerResponse = { id: msg.id, type: "pong" };
			ctx.postMessage(res);
			return;
		}
		if (msg.type === "window") {
			const columns = streamingWindowTransferable({
				buffer: msg.buffer,
				chunk: msg.chunk,
				capacity: msg.capacity,
			});
			const res: WorkerResponse = { id: msg.id, type: "window", columns };
			ctx.postMessage(
				res,
				columns.map((c) => c.buffer),
			);
			return;
		}
	} catch (err) {
		const res: WorkerResponse = {
			id: msg.id,
			type: "error",
			message: err instanceof Error ? err.message : String(err),
		};
		ctx.postMessage(res);
	}
};
