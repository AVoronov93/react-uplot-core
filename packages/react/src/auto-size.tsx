import { type CSSProperties, type ReactNode, useLayoutEffect, useRef, useState } from "react";

export type AutoSizeProps = {
	children: (size: { width: number; height: number }) => ReactNode;
	className?: string;
	style?: CSSProperties;
	minWidth?: number;
	minHeight?: number;
};

/**
 * Observes its container and supplies integer content-box dimensions to children.
 */
export function AutoSize({
	children,
	className,
	style,
	minWidth = 0,
	minHeight = 0,
}: AutoSizeProps) {
	const ref = useRef<HTMLDivElement>(null);
	const [size, setSize] = useState({ width: minWidth, height: minHeight });

	useLayoutEffect(() => {
		const element = ref.current;
		if (!element) return;

		const update = (width: number, height: number) => {
			const next = {
				width: Math.max(minWidth, Math.floor(width)),
				height: Math.max(minHeight, Math.floor(height)),
			};
			setSize((current) =>
				current.width === next.width && current.height === next.height ? current : next,
			);
		};

		const observer = new ResizeObserver(([entry]) => {
			if (!entry) return;
			const box = entry.contentBoxSize;
			const contentBox = Array.isArray(box) ? box[0] : box;
			update(contentBox?.inlineSize ?? entry.contentRect.width, contentBox?.blockSize ?? entry.contentRect.height);
		});

		observer.observe(element);
		return () => observer.disconnect();
	}, [minWidth, minHeight]);

	return (
		<div ref={ref} className={className} style={style}>
			{children(size)}
		</div>
	);
}
