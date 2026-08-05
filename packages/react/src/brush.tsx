import {
	type CSSProperties,
	type KeyboardEvent as ReactKeyboardEvent,
	type PointerEvent as ReactPointerEvent,
	type ReactNode,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { useChartHandle } from "./context.js";
import { useScales } from "./hooks.js";

export type TimeRange = {
	min: number;
	max: number;
};

export type BrushProps = {
	/** Controlled scale range (data values, not CSS pixels). */
	value?: TimeRange | null;
	/** Called when the user changes the range (zoom, grips, or both). */
	onChange?: (range: TimeRange) => void;
	/** Disable applying controlled value (e.g. while streaming). */
	disabled?: boolean;
	/** Axis along which the brush selects. @default "x" */
	orientation?: "x" | "y";
	scaleKey?: string;
	/**
	 * Drive the x-scale from `value` (detail / zoom charts).
	 * Set false on overview frame-selectors that stay full-range.
	 * @default true
	 */
	bindScale?: boolean;
	/**
	 * Mirror `value` as uPlot's native `.u-select` rect.
	 * Defaults to `true` when `grips` is on. Pass `false` for fully custom band chrome
	 * (children / bandStyle) without the stock select paint.
	 */
	showSelect?: boolean;
	/**
	 * Draggable edge grips over the select band.
	 * Library owns valToPos / posToVal — apps only see data-space min/max.
	 */
	grips?: boolean;
	/** Allow dragging the band interior to move the window without resizing it. */
	panBand?: boolean;
	/** Grip hit area width in CSS px. */
	gripWidth?: number;
	/** Class on the translucent selection band. */
	bandClassName?: string;
	/** Class on both grip hit targets (also get `ruplot-brush-grip--min|max`). */
	gripClassName?: string;
	/** Override / extend band chrome (merged after defaults). */
	bandStyle?: CSSProperties;
	/** Override / extend grip chrome (merged after defaults). */
	gripStyle?: CSSProperties;
	/** Content inside the band (e.g. a sparkline minimap between the grips). */
	children?: ReactNode;
};

type GripSide = "min" | "max";
type DragSide = GripSide | "pan";

type OverlayLayout = {
	band: { left: number; top: number; width: number; height: number };
	minPos: number;
	maxPos: number;
};

/** Data-space extent for a scale (not the current zoomed scale limits). */
function readScaleDataExtent(instance: uPlot, scaleKey: string): { lo: number; hi: number } | null {
	const scan = (col: uPlot.AlignedData[number] | undefined) => {
		if (!col?.length) return null;
		let lo = Infinity;
		let hi = -Infinity;
		for (let i = 0; i < col.length; i++) {
			const v = col[i];
			if (v != null && Number.isFinite(v)) {
				lo = Math.min(lo, v);
				hi = Math.max(hi, v);
			}
		}
		return lo < hi ? { lo, hi } : null;
	};

	if (scaleKey === "x") {
		return scan(instance.data[0]);
	}

	for (let si = 1; si < instance.series.length; si++) {
		const s = instance.series[si];
		if (!s || s.scale !== scaleKey) continue;
		const bounds = scan(instance.data[si]);
		if (bounds) return bounds;
	}
	return null;
}

/**
 * Grip drag limits. When `bindScale`, the brush owns the scale — clamp to data extent
 * so grips can widen the window, not only shrink within the current zoom.
 */
function gripDomain(
	instance: uPlot,
	scaleKey: string,
	bindScale: boolean,
): { lo: number; hi: number } | null {
	const sc = instance.scales[scaleKey];
	if (sc?.min == null || sc?.max == null) return null;
	if (!bindScale) return { lo: sc.min, hi: sc.max };
	const data = readScaleDataExtent(instance, scaleKey);
	return data ?? { lo: sc.min, hi: sc.max };
}

/**
 * Controlled range bound to a uPlot scale and/or select band.
 *
 * - Detail chart: `bindScale` (default) — `value` ↔ `setScale`.
 * - Overview / frame selector: `bindScale={false} grips` — `value` ↔ select + grips.
 */
export function Brush({
	value,
	onChange,
	disabled = false,
	orientation = "x",
	scaleKey = "x",
	bindScale = true,
	showSelect,
	grips = false,
	panBand = false,
	gripWidth = 8,
	bandClassName,
	gripClassName,
	bandStyle,
	gripStyle: gripStyleProp,
	children,
}: BrushProps) {
	const { session, getInstance } = useChartHandle();
	const applyingRef = useRef(false);
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;
	const dragRef = useRef<{ side: DragSide; start: TimeRange; startValue: number } | null>(null);
	const [overlay, setOverlay] = useState<OverlayLayout | null>(null);

	const scale = useScales((s) => s[scaleKey]);
	/** Native `.u-select` paint — off when apps fully own band chrome. */
	const paintSelect = showSelect ?? grips;

	// Push controlled value → uPlot scale
	useLayoutEffect(() => {
		if (!bindScale || disabled || value == null) return;
		const instance = getInstance();
		if (!instance) return;
		if (value.min === value.max) return;

		const current = instance.scales[scaleKey];
		if (current?.min === value.min && current?.max === value.max) return;

		applyingRef.current = true;
		session.apply([{ type: "setScale", key: scaleKey, min: value.min, max: value.max }]);
		applyingRef.current = false;
	}, [bindScale, value, disabled, scaleKey, getInstance, session]);

	// Pull uPlot scale → onChange (user zoom on detail charts)
	useLayoutEffect(() => {
		if (!bindScale || disabled || !onChangeRef.current) return;
		if (applyingRef.current) return;
		if (scale?.min == null || scale?.max == null) return;
		if (value && value.min === scale.min && value.max === scale.max) return;

		onChangeRef.current({ min: scale.min, max: scale.max });
	}, [bindScale, scale, disabled, value]);

	// Mirror value → optional setSelect + overlay geometry for grips / custom band
	useLayoutEffect(() => {
		if (disabled || value == null || value.min === value.max) {
			setOverlay(null);
			return;
		}
		if (!grips && !panBand && !paintSelect) {
			setOverlay(null);
			return;
		}

		const instance = getInstance();
		if (!instance) return;

		// CSS positions of the data-space edges (Y is inverted: max value → smaller top).
		const minCss = instance.valToPos(value.min, scaleKey);
		const maxCss = instance.valToPos(value.max, scaleKey);
		const rangeStart = Math.min(minCss, maxCss);
		const rangeLength = Math.max(Math.abs(maxCss - minCss), 1);

		const over = instance.root.querySelector(".u-over") as HTMLElement | null;
		const wrap = instance.root.parentElement;
		if (!over || !wrap) {
			setOverlay(null);
			return;
		}

		const select =
			orientation === "x"
				? { left: rangeStart, top: 0, width: rangeLength, height: over.clientHeight }
				: { left: 0, top: rangeStart, width: over.clientWidth, height: rangeLength };

		applyingRef.current = true;
		session.apply([
			{
				type: "setSelect",
				select: paintSelect ? select : { left: 0, top: 0, width: 0, height: 0 },
			},
		]);
		applyingRef.current = false;

		if (!grips && !panBand) {
			setOverlay(null);
			return;
		}

		const wrapRect = wrap.getBoundingClientRect();
		const overRect = over.getBoundingClientRect();
		const overLeft = overRect.left - wrapRect.left;
		const overTop = overRect.top - wrapRect.top;
		const bandLeft = overLeft + (orientation === "x" ? rangeStart : 0);
		const bandTop = overTop + (orientation === "y" ? rangeStart : 0);

		setOverlay({
			band: {
				left: bandLeft,
				top: bandTop,
				width: orientation === "x" ? rangeLength : overRect.width,
				height: orientation === "y" ? rangeLength : overRect.height,
			},
			// Grip sides track data min/max, not band CSS edges (critical for inverted Y).
			minPos: orientation === "x" ? overLeft + minCss : overTop + minCss,
			maxPos: orientation === "x" ? overLeft + maxCss : overTop + maxCss,
		});
	}, [
		value,
		disabled,
		paintSelect,
		grips,
		panBand,
		orientation,
		scaleKey,
		getInstance,
		session,
		scale,
	]);

	const onPointerDown = (side: DragSide) => (e: ReactPointerEvent<HTMLDivElement>) => {
		if (disabled || !value || !onChangeRef.current) return;
		const instance = getInstance();
		if (!instance) return;
		const over = instance.root.querySelector(".u-over") as HTMLElement | null;
		if (!over) return;
		e.preventDefault();
		e.stopPropagation();
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		const rect = over.getBoundingClientRect();
		const position = orientation === "x" ? e.clientX - rect.left : e.clientY - rect.top;
		dragRef.current = {
			side,
			start: value,
			startValue: instance.posToVal(position, scaleKey),
		};
	};

	const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
		const drag = dragRef.current;
		if (!drag || !onChangeRef.current || !value) return;
		const instance = getInstance();
		if (!instance) return;

		const over = instance.root.querySelector(".u-over") as HTMLElement | null;
		if (!over) return;

		const sc = instance.scales[scaleKey];
		const domain = gripDomain(instance, scaleKey, bindScale);
		if (!domain) return;
		const { lo, hi } = domain;
		if (!(lo < hi)) return;

		const rect = over.getBoundingClientRect();
		const length = orientation === "x" ? over.clientWidth : over.clientHeight;
		const pointer = orientation === "x" ? e.clientX - rect.left : e.clientY - rect.top;
		const position = Math.min(length, Math.max(0, pointer));
		const nextVal = Math.min(hi, Math.max(lo, instance.posToVal(position, scaleKey)));

		let min = value.min;
		let max = value.max;
		if (drag.side === "pan") {
			const width = drag.start.max - drag.start.min;
			min = Math.max(lo, Math.min(drag.start.min + (nextVal - drag.startValue), hi - width));
			max = min + width;
		} else if (drag.side === "min") {
			min = Math.min(nextVal, max);
			// Keep a non-empty window; never leave the scale domain.
			if (!(min < max)) min = Math.min(max, lo);
			min = Math.max(lo, Math.min(min, max));
		} else {
			max = Math.max(nextVal, min);
			if (!(min < max)) max = Math.max(min, hi);
			max = Math.min(hi, Math.max(max, min));
		}
		if (!(min < max)) return;
		if (min === value.min && max === value.max) return;
		onChangeRef.current({ min, max });
	};

	const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
		dragRef.current = null;
		try {
			(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
		} catch {
			// already released
		}
	};

	const onGripKeyDown = (side: GripSide) => (e: ReactKeyboardEvent<HTMLDivElement>) => {
		if (disabled || !value || !onChangeRef.current) return;
		const instance = getInstance();
		if (!instance) return;
		const domain = gripDomain(instance, scaleKey, bindScale);
		if (!domain) return;
		const { lo, hi } = domain;
		const step = (hi - lo) / 50;
		const backward =
			(orientation === "x" && e.key === "ArrowLeft") ||
			(orientation === "y" && e.key === "ArrowDown");
		const forward =
			(orientation === "x" && e.key === "ArrowRight") ||
			(orientation === "y" && e.key === "ArrowUp");
		if (!backward && !forward) return;
		e.preventDefault();
		const delta = forward ? step : -step;
		let min = value.min;
		let max = value.max;
		if (side === "min") {
			min = Math.max(lo, Math.min(max - step * 0.25, min + delta));
		} else {
			max = Math.min(hi, Math.max(min + step * 0.25, max + delta));
		}
		if (!(min < max) || (min === value.min && max === value.max)) return;
		onChangeRef.current({ min, max });
	};

	if ((!grips && !panBand) || !overlay || disabled) {
		return null;
	}

	const gripBox = (position: number): CSSProperties => ({
		position: "absolute",
		left: orientation === "x" ? position - gripWidth / 2 : overlay.band.left,
		top: orientation === "y" ? position - gripWidth / 2 : overlay.band.top,
		width: orientation === "x" ? gripWidth : overlay.band.width,
		height: orientation === "y" ? gripWidth : overlay.band.height,
		cursor: orientation === "x" ? "ew-resize" : "ns-resize",
		zIndex: 6,
		touchAction: "none",
		background: "rgba(14, 165, 233, 0.35)",
		...gripStyleProp,
	});

	const gripCls = (side: GripSide) =>
		["ruplot-brush-grip", `ruplot-brush-grip--${side}`, gripClassName].filter(Boolean).join(" ");

	return (
		<>
			<div
				aria-hidden
				className={bandClassName}
				style={{
					position: "absolute",
					left: overlay.band.left,
					top: overlay.band.top,
					width: overlay.band.width,
					height: overlay.band.height,
					pointerEvents: panBand ? "auto" : "none",
					zIndex: 4,
					background: "rgba(14, 165, 233, 0.12)",
					borderLeft: orientation === "x" ? "1px solid rgba(14, 165, 233, 0.7)" : undefined,
					borderRight: orientation === "x" ? "1px solid rgba(14, 165, 233, 0.7)" : undefined,
					borderTop: orientation === "y" ? "1px solid rgba(14, 165, 233, 0.7)" : undefined,
					borderBottom: orientation === "y" ? "1px solid rgba(14, 165, 233, 0.7)" : undefined,
					boxSizing: "border-box",
					overflow: "hidden",
					...bandStyle,
				}}
				onPointerDown={panBand ? onPointerDown("pan") : undefined}
				onPointerMove={panBand ? onPointerMove : undefined}
				onPointerUp={panBand ? onPointerUp : undefined}
				onPointerCancel={panBand ? onPointerUp : undefined}
			>
				{children}
			</div>
			{grips && <div
				role="slider"
				aria-label="Brush range start"
				aria-orientation={orientation === "y" ? "vertical" : "horizontal"}
				aria-valuemin={value?.min}
				aria-valuemax={value?.max}
				aria-valuenow={value?.min}
				tabIndex={0}
				data-side="min"
				className={gripCls("min")}
				style={gripBox(overlay.minPos)}
				onPointerDown={onPointerDown("min")}
				onPointerMove={onPointerMove}
				onPointerUp={onPointerUp}
				onPointerCancel={onPointerUp}
				onKeyDown={onGripKeyDown("min")}
			/>
			}
			{grips && <div
				role="slider"
				aria-label="Brush range end"
				aria-orientation={orientation === "y" ? "vertical" : "horizontal"}
				aria-valuemin={value?.min}
				aria-valuemax={value?.max}
				aria-valuenow={value?.max}
				tabIndex={0}
				data-side="max"
				className={gripCls("max")}
				style={gripBox(overlay.maxPos)}
				onPointerDown={onPointerDown("max")}
				onPointerMove={onPointerMove}
				onPointerUp={onPointerUp}
				onPointerCancel={onPointerUp}
				onKeyDown={onGripKeyDown("max")}
			/>
			}
		</>
	);
}
