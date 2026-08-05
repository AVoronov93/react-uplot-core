import type uPlot from "uplot";
import type { ChartSession } from "./session.js";

/**
 * Imperative plugin contract: init after uPlot is ready, cleanup on leave/recreate.
 * Plugins must NOT call setData — the host owns the data plane.
 */
export type RuplotPluginContext = {
	u: uPlot;
	session: ChartSession;
};

export type RuplotPluginCleanup = () => void;

export type RuplotPlugin = {
	/** Stable identity — same key across renders avoids teardown/re-init. */
	key: string;
	/**
	 * Native uPlot plugin merged into options.plugins (draw hooks, etc.).
	 * Prefer this for canvas overlays so uPlot owns the paint cycle.
	 */
	uplot?: uPlot.Plugin;
	/** DOM / subscriptions after the instance exists. Return cleanup. */
	init?: (ctx: RuplotPluginContext) => RuplotPluginCleanup | void;
};

export type PluginRuntime = {
	/** Diff by key: destroy removed, init added. Re-inits all after recreate. */
	sync: (plugins: readonly RuplotPlugin[], ctx: RuplotPluginContext) => void;
	destroy: () => void;
	readonly activeKeys: readonly string[];
};

export function createPlugin(plugin: RuplotPlugin): RuplotPlugin {
	return plugin;
}

export function createPluginRuntime(): PluginRuntime {
	const cleanups = new Map<string, RuplotPluginCleanup>();
	let generation = 0;

	const destroyOne = (key: string) => {
		const cleanup = cleanups.get(key);
		if (!cleanup) return;
		cleanups.delete(key);
		try {
			cleanup();
		} catch {
			// Plugin cleanup must not break session teardown.
		}
	};

	const destroyAll = () => {
		for (const key of [...cleanups.keys()]) {
			destroyOne(key);
		}
	};

	return {
		get activeKeys() {
			return [...cleanups.keys()];
		},
		sync(plugins, ctx) {
			const nextKeys = new Set(plugins.map((p) => p.key));

			for (const key of [...cleanups.keys()]) {
				if (!nextKeys.has(key)) destroyOne(key);
			}

			const gen = generation;
			for (const plugin of plugins) {
				if (cleanups.has(plugin.key)) continue;
				if (!plugin.init) {
					cleanups.set(plugin.key, () => {});
					continue;
				}
				const cleanup = plugin.init(ctx) ?? (() => {});
				// Drop if a recreate raced ahead of this init.
				if (gen !== generation) {
					cleanup();
					continue;
				}
				cleanups.set(plugin.key, cleanup);
			}
		},
		destroy() {
			generation += 1;
			destroyAll();
		},
	};
}

/** Keys signature for options merge caching. */
export function pluginKeysSignature(plugins: readonly RuplotPlugin[]): string {
	if (plugins.length === 0) return "";
	return plugins.map((p) => p.key).join("\0");
}

/** Collect native uPlot.Plugin entries from ruplot plugins. */
export function collectUPlotPlugins(
	plugins: readonly RuplotPlugin[],
): uPlot.Plugin[] {
	const out: uPlot.Plugin[] = [];
	for (const plugin of plugins) {
		if (plugin.uplot) out.push(plugin.uplot);
	}
	return out;
}
