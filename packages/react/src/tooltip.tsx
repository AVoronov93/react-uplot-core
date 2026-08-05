import { type CSSProperties, type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { useChartHandle } from "./context.js";
import { useCursor } from "./hooks.js";

export type TooltipRenderProps = {
	idx: number | null;
	/** Cursor x in plot CSS px. */
	left: number;
	/** Cursor y in plot CSS px. */
	top: number;
	/** Absolute position within the Chart wrapper (after clamp). */
	style: CSSProperties;
	visible: boolean;
};

export type TooltipProps = {
	/** App owns content / i18n — library only positions. */
	children: (props: TooltipRenderProps) => ReactNode;
	offset?: { x: number; y: number };
	className?: string;
	/**
	 * Keep the tooltip box inside the Chart wrapper.
	 * Flips to the left/above the cursor when near the far edges.
	 * @default true
	 */
	clamp?: boolean;
	/**
	 * Announce tooltip content to assistive tech while visible.
	 * @default "polite"
	 */
	ariaLive?: "off" | "polite" | "assertive";
};

/**
 * Positioning shell for cursor tooltips.
 * Renders as an overlay sibling of the uPlot root; no domain HTML.
 */
export function Tooltip({
	children,
	offset = { x: 12, y: 8 },
	className,
	clamp = true,
	ariaLive = "polite",
}: TooltipProps) {
	const { getInstance } = useChartHandle();
	const cursor = useCursor();
	const wrapRef = useRef<HTMLDivElement>(null);
	const [anchor, setAnchor] = useState({ x: 0, y: 0 });

	const visible = cursor.idx != null && cursor.left >= 0 && cursor.top >= 0;

	useLayoutEffect(() => {
		if (!visible) return;
		const instance = getInstance();
		const shell = wrapRef.current;
		const wrap = shell?.parentElement;
		if (!instance || !shell || !wrap) return;

		const over = instance.root.querySelector(".u-over") as HTMLElement | null;
		if (!over) return;

		const wrapRect = wrap.getBoundingClientRect();
		const overRect = over.getBoundingClientRect();
		const cursorX = overRect.left - wrapRect.left + cursor.left;
		const cursorY = overRect.top - wrapRect.top + cursor.top;

		const place = () => {
			let x = cursorX + offset.x;
			let y = cursorY + offset.y;

			if (clamp) {
				const tw = shell.offsetWidth;
				const th = shell.offsetHeight;
				const maxX = Math.max(0, wrap.clientWidth - tw);
				const maxY = Math.max(0, wrap.clientHeight - th);

				if (tw > 0 && x + tw > wrap.clientWidth) {
					x = cursorX - offset.x - tw;
				}
				if (th > 0 && y + th > wrap.clientHeight) {
					y = cursorY - offset.y - th;
				}

				x = Math.min(Math.max(0, x), maxX);
				y = Math.min(Math.max(0, y), maxY);
			}

			setAnchor((prev) => (prev.x === x && prev.y === y ? prev : { x, y }));
		};

		place();
		// Remeasure after children paint (first frame may be 0×0).
		const raf = clamp ? requestAnimationFrame(place) : 0;
		return () => {
			if (raf) cancelAnimationFrame(raf);
		};
	}, [visible, cursor.left, cursor.top, getInstance, offset.x, offset.y, clamp]);

	const style: CSSProperties = {
		position: "absolute",
		left: anchor.x,
		top: anchor.y,
		pointerEvents: "none",
		zIndex: 5,
		opacity: visible ? 1 : 0,
	};

	return (
		<div
			ref={wrapRef}
			className={className}
			style={style}
			role="tooltip"
			aria-hidden={!visible}
			aria-live={ariaLive === "off" ? undefined : ariaLive}
		>
			{children({
				idx: cursor.idx,
				left: cursor.left,
				top: cursor.top,
				style,
				visible,
			})}
		</div>
	);
}
