import type { ReactNode } from "react";
import type uPlot from "uplot";
import type { CompetitorId } from "../shared/types";

export type AdapterContext = {
	host: HTMLElement;
	options: uPlot.Options;
	data: uPlot.AlignedData;
	onReactCommit?: () => void;
};

export type ChartAdapter = {
	id: CompetitorId;
	/** Mount chart into host. Returns dispose. */
	mount: (ctx: AdapterContext) => Promise<() => void> | (() => void);
	/** Push new data. For baseline this is setData; for React, re-render. */
	updateData: (data: uPlot.AlignedData, resetScales?: boolean) => void;
	setSize: (width: number, height: number) => void;
	setScale: (key: string, min: number, max: number) => void;
	setCursor: (left: number, top: number) => void;
	getInstance: () => uPlot | null;
};

export type ReactAdapterRender = (props: {
	data: uPlot.AlignedData;
	options: uPlot.Options;
	resetScales?: boolean;
	onReady?: (chart: uPlot) => void;
}) => ReactNode;
