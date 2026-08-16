import {
	type ChartSession,
	classifyOptions,
	createChartSession,
	streamingResetScales,
} from "@ruplot/core";
import { type CSSProperties, useLayoutEffect, useRef } from "react";
import type uPlot from "uplot";
import { Chart } from "./chart.js";

/**
 * Props aligned with [uplot-react](https://www.npmjs.com/package/uplot-react).
 * Prefer {@link Chart} for new code; this entry is a migration convenience.
 */
export type UplotReactProps = {
	options: uPlot.Options;
	data: uPlot.AlignedData;
	/**
	 * Optional external DOM host (uplot-react parity).
	 * `HTMLElement` only — uplot-react init-function targets are not supported.
	 * When omitted, ruplot owns an internal div (recommended).
	 */
	target?: HTMLElement;
	/** Fires after mount / recreate with the live uPlot instance. */
	onCreate?: (chart: uPlot) => void;
	/** Fires once on unmount, before destroy, with the last instance. */
	onDelete?: (chart: uPlot) => void;
	className?: string;
	style?: CSSProperties;
	/** When false, setData preserves scale ranges (uplot-react parity). */
	resetScales?: boolean;
};

/**
 * Drop-in stand-in for `uplot-react`'s default export.
 *
 * @example
 * ```tsx
 * import UplotReact from "@ruplot/react/compat";
 * <UplotReact options={options} data={data} onCreate={onReady} resetScales={false} />
 * ```
 */
export function UplotReact(props: UplotReactProps) {
	const { options, data, target, onCreate, onDelete, className, style, resetScales } = props;

	if (target) {
		return (
			<UplotReactExternalTarget
				options={options}
				data={data}
				target={target}
				{...(onCreate ? { onCreate } : {})}
				{...(onDelete ? { onDelete } : {})}
				{...(resetScales !== undefined ? { resetScales } : {})}
			/>
		);
	}

	return (
		<UplotReactOwned
			options={options}
			data={data}
			{...(onCreate ? { onCreate } : {})}
			{...(onDelete ? { onDelete } : {})}
			{...(className !== undefined ? { className } : {})}
			{...(style !== undefined ? { style } : {})}
			{...(resetScales !== undefined ? { resetScales } : {})}
		/>
	);
}

export default UplotReact;

function UplotReactOwned(props: Omit<UplotReactProps, "target">) {
	const { options, data, onCreate, onDelete, className, style, resetScales } = props;
	const instanceRef = useRef<uPlot | null>(null);
	const onDeleteRef = useRef(onDelete);
	onDeleteRef.current = onDelete;

	useLayoutEffect(() => {
		return () => {
			const u = instanceRef.current;
			if (u) onDeleteRef.current?.(u);
			instanceRef.current = null;
		};
	}, []);

	return (
		<Chart
			data={data}
			options={options}
			{...(className !== undefined ? { className } : {})}
			{...(style !== undefined ? { style } : {})}
			{...(resetScales !== undefined ? { resetScales } : {})}
			onReady={(u) => {
				instanceRef.current = u;
				onCreate?.(u);
			}}
		/>
	);
}

function UplotReactExternalTarget(props: {
	options: uPlot.Options;
	data: uPlot.AlignedData;
	target: HTMLElement;
	onCreate?: (chart: uPlot) => void;
	onDelete?: (chart: uPlot) => void;
	resetScales?: boolean;
}) {
	const { options, data, target, onCreate, onDelete, resetScales } = props;
	const sessionRef = useRef<ChartSession | null>(null);
	const prevOptionsRef = useRef<uPlot.Options | null>(null);
	const prevDataRef = useRef<uPlot.AlignedData | null>(null);
	const onCreateRef = useRef(onCreate);
	const onDeleteRef = useRef(onDelete);
	onCreateRef.current = onCreate;
	onDeleteRef.current = onDelete;

	const optionsRef = useRef(options);
	const dataRef = useRef(data);
	optionsRef.current = options;
	dataRef.current = data;

	// Mount against this target once; prop updates go through the effect below.
	useLayoutEffect(() => {
		const session = createChartSession({
			target,
			options: optionsRef.current,
			data: dataRef.current,
		});
		sessionRef.current = session;
		prevOptionsRef.current = optionsRef.current;
		prevDataRef.current = dataRef.current;
		const u = session.getInstance();
		if (u) onCreateRef.current?.(u);

		return () => {
			const last = session.getInstance();
			if (last) onDeleteRef.current?.(last);
			session.destroy();
			sessionRef.current = null;
			prevOptionsRef.current = null;
			prevDataRef.current = null;
		};
	}, [target]);

	useLayoutEffect(() => {
		const session = sessionRef.current;
		if (!session) return;

		session.setUserHooks(options.hooks);
		session.setUserAxes(options.axes);

		const result = classifyOptions({
			prevOptions: prevOptionsRef.current,
			nextOptions: options,
			prevData: prevDataRef.current,
			nextData: data,
			...(resetScales !== undefined
				? { resetScales: streamingResetScales(undefined, resetScales) }
				: { resetScales: streamingResetScales(undefined) }),
		});
		if (result.kind === "none") return;

		const applied = session.apply(result.commands);
		prevOptionsRef.current = options;
		prevDataRef.current = data;

		if (applied.recreated) {
			const u = session.getInstance();
			if (u) onCreateRef.current?.(u);
		}
	}, [options, data, resetScales]);

	return null;
}
