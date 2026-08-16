import { type DependencyList, useMemo } from "react";
import type uPlot from "uplot";

/**
 * Stable `options` for {@link Chart} — prefer this over inline `options={{ … }}`.
 *
 * @example
 * ```tsx
 * const options = useChartOptions(
 *   () => ({
 *     width: 800,
 *     height: 300,
 *     series: [{}, { stroke: color }],
 *     scales: { x: { time: false } },
 *   }),
 *   [color],
 * );
 * ```
 */
export function useChartOptions(factory: () => uPlot.Options, deps: DependencyList): uPlot.Options {
	// eslint-disable-next-line react-hooks/exhaustive-deps -- caller owns deps explicitly
	return useMemo(factory, deps);
}
