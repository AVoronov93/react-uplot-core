/**
 * Unstable APIs re-exported for convenience.
 *
 * These may change without a major bump before 1.0. Prefer `@ruplot/core`
 * for long-lived advanced integrations, or pin a version tightly.
 *
 * @packageDocumentation
 */
export {
	streamingWindowTransferable,
	createDataPlane,
	createDataWorker,
	rebindSyncGroup,
} from "@ruplot/core";
export type {
	DataPlane,
	DataWorkerClient,
	DataWorkerRequest,
	DataWorkerResponse,
} from "@ruplot/core";
