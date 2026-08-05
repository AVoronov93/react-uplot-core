import {
	type PointerEvent as ReactPointerEvent,
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
} from "react";

export type Size = { width: number; height: number };

export type DragResizeFrameProps = {
	width: number;
	height: number;
	minWidth?: number;
	maxWidth?: number;
	minHeight?: number;
	maxHeight?: number;
	/** Fired each animation frame while the handle is dragged. */
	onSize: (size: Size) => void;
	onDragChange?: (dragging: boolean) => void;
	children: ReactNode;
};

/**
 * Draggable SE corner — continuous size updates so FPS meters can show setSize cost.
 */
export function DragResizeFrame({
	width,
	height,
	minWidth = 280,
	maxWidth = 1100,
	minHeight = 160,
	maxHeight = 520,
	onSize,
	onDragChange,
	children,
}: DragResizeFrameProps) {
	const draggingRef = useRef(false);
	const frameRef = useRef<HTMLDivElement>(null);
	const dragRef = useRef<{
		pointerId: number;
		startX: number;
		startY: number;
		origW: number;
		origH: number;
	} | null>(null);
	const pending = useRef<Size | null>(null);
	const raf = useRef(0);
	const onSizeRef = useRef(onSize);
	const onDragChangeRef = useRef(onDragChange);
	onSizeRef.current = onSize;
	onDragChangeRef.current = onDragChange;

	const setDragging = (next: boolean) => {
		if (draggingRef.current === next) return;
		draggingRef.current = next;
		frameRef.current?.classList.toggle("is-dragging", next);
		onDragChangeRef.current?.(next);
	};

	const flush = useCallback(() => {
		raf.current = 0;
		const next = pending.current;
		if (!next) return;
		pending.current = null;
		onSizeRef.current(next);
	}, []);

	const queueSize = useCallback(
		(next: Size) => {
			pending.current = next;
			if (!raf.current) raf.current = requestAnimationFrame(flush);
		},
		[flush],
	);

	useEffect(() => () => cancelAnimationFrame(raf.current), []);

	const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.currentTarget.setPointerCapture(e.pointerId);
		dragRef.current = {
			pointerId: e.pointerId,
			startX: e.clientX,
			startY: e.clientY,
			origW: width,
			origH: height,
		};
		setDragging(true);
	};

	const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
		const drag = dragRef.current;
		if (!drag || drag.pointerId !== e.pointerId) return;
		const nextW = Math.round(
			Math.min(maxWidth, Math.max(minWidth, drag.origW + (e.clientX - drag.startX))),
		);
		const nextH = Math.round(
			Math.min(maxHeight, Math.max(minHeight, drag.origH + (e.clientY - drag.startY))),
		);
		queueSize({ width: nextW, height: nextH });
	};

	const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
		const drag = dragRef.current;
		if (!drag || drag.pointerId !== e.pointerId) return;
		dragRef.current = null;
		if (pending.current) flush();
		setDragging(false);
	};

	return (
		<div ref={frameRef} className="drag-resize-frame" style={{ width, height }}>
			<div className="drag-resize-frame__body">{children}</div>
			<div
				className="drag-resize-frame__handle"
				title="Drag to resize"
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
				onPointerUp={endDrag}
				onPointerCancel={endDrag}
			/>
			<span className="drag-resize-frame__hint">↘ drag</span>
		</div>
	);
}
