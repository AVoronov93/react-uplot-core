import { type CSSProperties } from "react";
import { useUPlot, useSeries } from "./hooks.js";

export type LegendProps = {
	className?: string;
	style?: CSSProperties;
};

/**
 * Interactive list of the chart's data series.
 */
export function Legend({ className, style }: LegendProps) {
	const { getInstance, session } = useUPlot();
	const { show } = useSeries();
	const instance = getInstance();

	if (!instance) return null;

	return (
		<div className={className} style={style}>
			{instance.series.slice(1).map((series, offset) => {
				const index = offset + 1;
				const visible = show[index] ?? series.show ?? true;

				return (
					<button
						type="button"
						key={index}
						aria-pressed={visible}
						onClick={() => {
							session.apply([{ type: "setSeries", index, opts: { show: !visible } }]);
						}}
					>
						{typeof series.label === "string"
							? series.label
							: (series.label?.textContent ?? `Series ${index}`)}
					</button>
				);
			})}
		</div>
	);
}
