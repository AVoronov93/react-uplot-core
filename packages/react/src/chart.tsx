import {
	type ChartDebugConfig,
	type ChartSession,
	type ChartStores,
	type DataPlane,
	type RuplotPlugin,
	type StreamingConfig,
	classifyOptions,
	collectUPlotPlugins,
	createChartSession,
	createChartStores,
	followXScale,
	normalizeStreaming,
	pluginKeysSignature,
	streamingResetScales,
	warnIfDataMutatedInPlace,
} from "@ruplot/core";
import {
	type CSSProperties,
	type ReactNode,
	forwardRef,
	useImperativeHandle,
	useLayoutEffect,
	useRef,
} from "react";
import type uPlot from "uplot";
import { ChartContext, type ChartHandle } from "./context.js";
import { warnIfOptionsIdentityThrash, warnIfPluginsIdentityThrash } from "./dev-warnings.js";
import { useSyncGroupContext, useSyncMembership } from "./sync-group.js";

export type ChartSyncProps = {
	/** Logical sync group id (overrides SyncGroup context). */
	group?: string;
	/** uPlot cursor.sync.key (defaults to group / context key). */
	key?: string;
	setSeries?: boolean;
};

export type ChartProps = {
	data: uPlot.AlignedData;
	options: uPlot.Options;
	/**
	 * Dual-read plane. When set, session.dataPlane is updated so plugins/tooltips
	 * can call getSource(); display columns still come from `data` (usually plane.display).
	 */
	dataPlane?: DataPlane | null;
	/**
	 * Ruplot plugins (threshold, DOM overlays). Native `uplot` hooks are merged
	 * into options; `init` runs via PluginRuntime after ready/recreate.
	 * Keep a stable array (module-level or usePlugin) to avoid recreate storms.
	 */
	plugins?: readonly RuplotPlugin[];
	/**
	 * When false, setData preserves scale ranges.
	 * Prefer `streaming` for the full policy (follow window, etc.).
	 */
	resetScales?: boolean;
	/**
	 * Streaming policy: preserve zoom by default and optionally follow x to the
	 * data window after each setData.
	 */
	streaming?: StreamingConfig;
	/** Explicit sync; otherwise inherits from nearest `<Chart.SyncGroup>`. */
	sync?: ChartSyncProps | false;
	/**
	 * Optional pre-created stores (SSR / shared HUD). When omitted, Chart creates its own.
	 */
	stores?: ChartStores;
	/**
	 * Dev observability: count commands, log recreate reasons.
	 * `true` ≡ `{ log: true }`. Also: `RUPLOT_DEBUG=1` env.
	 */
	debug?: boolean | ChartDebugConfig;
	className?: string;
	style?: CSSProperties;
	children?: ReactNode;
	onReady?: (chart: uPlot) => void;
};

export type ChartRef = ChartHandle;

type MergedOptionsCache = {
	base: uPlot.Options;
	syncKey: string | null;
	setSeries: boolean;
	pluginKeys: string;
	merged: uPlot.Options;
};

const EMPTY_PLUGINS: readonly RuplotPlugin[] = [];

function mergeChartOptions(
	options: uPlot.Options,
	syncKey: string | null,
	setSeries: boolean,
	plugins: readonly RuplotPlugin[],
	cache: MergedOptionsCache | null,
): { options: uPlot.Options; cache: MergedOptionsCache } {
	const pluginKeys = pluginKeysSignature(plugins);
	if (
		cache &&
		cache.base === options &&
		cache.syncKey === syncKey &&
		cache.setSeries === setSeries &&
		cache.pluginKeys === pluginKeys
	) {
		return { options: cache.merged, cache };
	}

	let merged: uPlot.Options = options;

	if (syncKey) {
		merged = {
			...merged,
			cursor: {
				...merged.cursor,
				sync: {
					...merged.cursor?.sync,
					key: syncKey,
					setSeries,
				},
			},
		};
	}

	const native = collectUPlotPlugins(plugins);
	if (native.length > 0) {
		merged = {
			...merged,
			plugins: [...(merged.plugins ?? []), ...native],
		};
	}

	return {
		options: merged,
		cache: { base: options, syncKey, setSeries, pluginKeys, merged },
	};
}

export const Chart = forwardRef<ChartRef, ChartProps>(function Chart(
	{
		data,
		options,
		dataPlane,
		plugins = EMPTY_PLUGINS,
		resetScales,
		streaming,
		sync,
		stores: storesProp,
		debug: debugProp,
		className,
		style,
		children,
		onReady,
	},
	ref,
) {
	const targetRef = useRef<HTMLDivElement>(null);
	const sessionRef = useRef<ChartSession | null>(null);
	const storesRef = useRef<ChartStores | null>(null);
	const handleRef = useRef<ChartHandle | null>(null);
	const prevOptionsRef = useRef<uPlot.Options | null>(null);
	const prevDataRef = useRef<uPlot.AlignedData | null>(null);
	const optionsMergeCacheRef = useRef<MergedOptionsCache | null>(null);
	const pluginsRef = useRef(plugins);
	pluginsRef.current = plugins;
	const onReadyRef = useRef(onReady);
	onReadyRef.current = onReady;
	const wrapHostRef = useRef<object>({});
	const prevPluginsForWarnRef = useRef<readonly RuplotPlugin[] | null>(null);
	const debugConfigRef = useRef<ChartDebugConfig | false>(false);
	const envDebug =
		typeof process !== "undefined" && process.env.RUPLOT_DEBUG === "1" ? { log: true } : false;
	debugConfigRef.current =
		debugProp === true
			? { log: true }
			: debugProp === false || debugProp == null
				? envDebug
				: debugProp;

	const syncCtx = useSyncGroupContext();
	const syncDisabled = sync === false;
	const groupId = syncDisabled ? null : (sync?.group ?? syncCtx?.id ?? null);
	const syncKey = syncDisabled ? null : (sync?.key ?? syncCtx?.key ?? groupId);
	const syncSetSeries = syncDisabled ? true : (sync?.setSeries ?? syncCtx?.setSeries ?? true);

	const streamingMode = normalizeStreaming(streaming);
	const effectiveResetScales = streamingResetScales(streaming, resetScales);

	if (storesRef.current === null) {
		storesRef.current = storesProp ?? createChartStores();
	}

	useSyncMembership({
		groupId,
		storesSync: storesRef.current.sync,
	});

	const merged = mergeChartOptions(
		options,
		syncKey,
		syncSetSeries,
		plugins,
		optionsMergeCacheRef.current,
	);
	optionsMergeCacheRef.current = merged.cache;
	const effectiveOptions = merged.options;

	// Stable handle — Context identity never changes after first render.
	if (handleRef.current === null) {
		const stores = storesRef.current;
		handleRef.current = {
			get session() {
				if (!sessionRef.current) {
					return {
						stores,
						getInstance: () => null,
						dataPlane: null,
						setPlugins: () => {},
						setUserHooks: () => {},
						setUserAxes: () => {},
						apply: () => ({ recreated: false, applied: [] }),
						noteClassify: () => {},
						getDebugSnapshot: () => ({
							stats: {
								recreate: 0,
								setData: 0,
								setSize: 0,
								setScale: 0,
								setSeries: 0,
								patchSeries: 0,
								setCursor: 0,
								setSelect: 0,
								batch: 0,
							},
							lastKind: null,
							lastReasons: [],
							lastApplied: [],
						}),
						setDebug: () => {},
						resetDebugStats: () => {},
						destroy: () => {},
					} satisfies ChartSession;
				}
				return sessionRef.current;
			},
			getInstance() {
				return sessionRef.current?.getInstance() ?? null;
			},
			getDebugSnapshot() {
				return (
					sessionRef.current?.getDebugSnapshot() ?? {
						stats: {
							recreate: 0,
							setData: 0,
							setSize: 0,
							setScale: 0,
							setSeries: 0,
							patchSeries: 0,
							setCursor: 0,
							setSelect: 0,
							batch: 0,
						},
						lastKind: null,
						lastReasons: [],
						lastApplied: [],
					}
				);
			},
		};
	}

	useImperativeHandle(ref, () => handleRef.current!, []);

	// Mount-only: updates go through the sync effect below.
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount/unmount lifecycle
	useLayoutEffect(() => {
		const target = targetRef.current;
		const stores = storesRef.current;
		if (!target || !stores) return;

		const session = createChartSession({
			target,
			options: effectiveOptions,
			data,
			stores,
			dataPlane: dataPlane ?? null,
			plugins: pluginsRef.current,
		});
		sessionRef.current = session;
		prevOptionsRef.current = effectiveOptions;
		prevDataRef.current = data;

		const instance = session.getInstance();
		if (instance) onReadyRef.current?.(instance);

		return () => {
			session.destroy();
			sessionRef.current = null;
			prevOptionsRef.current = null;
			prevDataRef.current = null;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useLayoutEffect(() => {
		const session = sessionRef.current;
		if (!session) return;

		if (dataPlane !== undefined) {
			session.dataPlane = dataPlane;
		}

		session.setPlugins(plugins);
		session.setUserHooks(options.hooks);
		session.setUserAxes(options.axes);

		warnIfDataMutatedInPlace(data);
		warnIfOptionsIdentityThrash(wrapHostRef.current, prevOptionsRef.current, effectiveOptions);
		warnIfPluginsIdentityThrash(wrapHostRef.current, prevPluginsForWarnRef.current, plugins);
		prevPluginsForWarnRef.current = plugins;

		const debugCfg = debugConfigRef.current;
		session.setDebug(Boolean(debugCfg), {
			log: debugCfg ? (debugCfg.log ?? true) : false,
		});

		const result = classifyOptions({
			prevOptions: prevOptionsRef.current,
			nextOptions: effectiveOptions,
			prevData: prevDataRef.current,
			nextData: data,
			resetScales: effectiveResetScales,
		});

		session.noteClassify(result);
		if (debugCfg) debugCfg.onClassify?.(result);

		if (result.kind === "none") return;

		const applyResult = session.apply(result.commands);
		prevOptionsRef.current = effectiveOptions;
		prevDataRef.current = data;

		const instance = session.getInstance();
		if (
			instance &&
			streamingMode.enabled &&
			streamingMode.follow &&
			result.commands.some((c) => c.type === "setData")
		) {
			followXScale(instance, data);
		}

		if (applyResult.recreated && instance) {
			onReadyRef.current?.(instance);
		}
	}, [
		data,
		dataPlane,
		plugins,
		effectiveOptions,
		effectiveResetScales,
		streamingMode.enabled,
		streamingMode.follow,
		options.hooks,
		options.axes,
	]);

	const wrapStyle: CSSProperties = {
		position: "relative",
		...style,
	};

	return (
		<ChartContext.Provider value={handleRef.current}>
			<div className={className} style={wrapStyle}>
				<div ref={targetRef} />
				{children}
			</div>
		</ChartContext.Provider>
	);
});
