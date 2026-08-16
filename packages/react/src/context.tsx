import type { ChartSession, SessionDebugSnapshot } from "@ruplot/core";
import { createContext, useContext } from "react";
import type uPlot from "uplot";

export type ChartHandle = {
	readonly session: ChartSession;
	readonly getInstance: () => uPlot | null;
	/** Classifier / command counters — useful with `debug` prop. */
	readonly getDebugSnapshot: () => SessionDebugSnapshot;
};

/**
 * Context value is a stable handle — identity does not change after mount,
 * so Context itself never triggers re-renders.
 */
export const ChartContext = createContext<ChartHandle | null>(null);

export function useChartHandle(): ChartHandle {
	const handle = useContext(ChartContext);
	if (!handle) {
		throw new Error("ruplot hooks must be used within <Chart>");
	}
	return handle;
}
