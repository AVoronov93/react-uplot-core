import type { CompetitorId } from "../shared/types";
import { createBaselineAdapter } from "./baseline";
import { createReactUplotAdapter } from "./react-uplot";
import { createRuplotAdapter } from "./ruplot";
import type { ChartAdapter } from "./types";
import { createUplotReactAdapter } from "./uplot-react";

export function createAdapter(id: CompetitorId, onCommit: () => void): ChartAdapter {
	switch (id) {
		case "baseline":
			return createBaselineAdapter();
		case "ruplot":
			return createRuplotAdapter(onCommit);
		case "uplot-react":
			return createUplotReactAdapter(onCommit);
		case "react-uplot":
			return createReactUplotAdapter(onCommit);
		default: {
			const _exhaustive: never = id;
			throw new Error(`Unknown competitor: ${_exhaustive}`);
		}
	}
}
