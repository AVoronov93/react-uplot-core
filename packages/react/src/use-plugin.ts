import type { RuplotPlugin, RuplotPluginCleanup, RuplotPluginContext } from "@ruplot/core";
import { type DependencyList, useMemo, useRef } from "react";
import type uPlot from "uplot";

/**
 * Stable RuplotPlugin across renders — keeps `key` identity so PluginRuntime
 * does not tear down on parent re-render. Pass deps when init closure inputs change.
 */
export function usePlugin(
	key: string,
	init: (ctx: RuplotPluginContext) => RuplotPluginCleanup | void,
	deps: DependencyList = [],
	uplot?: uPlot.Plugin,
): RuplotPlugin {
	const initRef = useRef(init);
	initRef.current = init;

	return useMemo(
		() => ({
			key,
			...(uplot ? { uplot } : {}),
			init: (ctx) => initRef.current(ctx),
		}),
		// Intentionally keyed by caller deps + identity of native plugin slot.
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[key, uplot, ...deps],
	);
}
