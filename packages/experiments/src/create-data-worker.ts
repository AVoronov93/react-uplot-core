import type { DataWorkerClient } from "@ruplot/core";
import { createDataWorker as createCoreDataWorker } from "@ruplot/core";

export type {
	DataWorkerRequest as WorkerRequest,
	DataWorkerResponse as WorkerResponse,
} from "@ruplot/core";

/**
 * @deprecated Import `createDataWorker` from `@ruplot/core` or `@ruplot/react/unstable`.
 * Kept so existing `@ruplot/experiments` imports keep working.
 */
export function createDataWorker(worker: Worker): DataWorkerClient {
	return createCoreDataWorker(worker);
}
