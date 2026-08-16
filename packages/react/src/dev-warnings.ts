import type { RuplotPlugin } from "@ruplot/core";
import type uPlot from "uplot";

const warnedOptions = new WeakSet<object>();
const warnedPlugins = new WeakSet<object>();

type ThrashState = {
	changes: number;
	lastAt: number;
};

const optionsThrash = new WeakMap<object, ThrashState>();
const pluginsThrash = new WeakMap<object, ThrashState>();

function isDev(): boolean {
	return typeof process === "undefined" || process.env.NODE_ENV !== "production";
}

/**
 * Dev-only: warn when `options` gets a new reference every update (inline object footgun).
 * Keyed by Chart host object so multiple charts do not share counters.
 */
export function warnIfOptionsIdentityThrash(
	host: object,
	prev: uPlot.Options | null,
	next: uPlot.Options,
): void {
	if (!isDev() || prev == null || prev === next) return;

	const now = Date.now();
	let state = optionsThrash.get(host);
	if (!state || now - state.lastAt > 2000) {
		state = { changes: 0, lastAt: now };
	}
	state.changes += 1;
	state.lastAt = now;
	optionsThrash.set(host, state);

	if (state.changes < 4 || warnedOptions.has(host)) return;
	warnedOptions.add(host);
	console.warn(
		"[ruplot] `options` is a new object every update. Inline `options={{…}}` forces extra classifier work and can recreate the chart. Use `useChartOptions(() => ({…}), deps)` or a module-level constant.",
	);
}

/**
 * Dev-only: warn when `plugins` array identity thrashs each render.
 */
export function warnIfPluginsIdentityThrash(
	host: object,
	prev: readonly RuplotPlugin[] | null,
	next: readonly RuplotPlugin[],
): void {
	if (!isDev() || prev == null || prev === next || next.length === 0) return;

	const now = Date.now();
	let state = pluginsThrash.get(host);
	if (!state || now - state.lastAt > 2000) {
		state = { changes: 0, lastAt: now };
	}
	state.changes += 1;
	state.lastAt = now;
	pluginsThrash.set(host, state);

	if (state.changes < 4 || warnedPlugins.has(host)) return;
	warnedPlugins.add(host);
	console.warn(
		"[ruplot] `plugins` is a new array every update. Keep a stable array (module scope, `useMemo`, or `usePlugin`) — identity changes recreate the chart.",
	);
}
