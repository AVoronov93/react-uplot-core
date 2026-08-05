import type uPlot from "uplot";

export type SelectRect = {
	left: number;
	top: number;
	width: number;
	height: number;
};

export type SeriesPatch = {
	show?: boolean;
	focus?: boolean;
};

/** Visual series fields that can update via mutate + redraw (no recreate). */
export type SeriesVisualPatch = {
	stroke?: uPlot.Series["stroke"];
	width?: uPlot.Series["width"];
	dash?: uPlot.Series["dash"];
	fill?: uPlot.Series["fill"];
	spanGaps?: uPlot.Series["spanGaps"];
};

export type ChartCommand =
	| {
			type: "recreate";
			options: uPlot.Options;
			data: uPlot.AlignedData;
			/** Keep scales/select/cursor across recreate. Default true. */
			preserveRuntime?: boolean;
	  }
	| {
			type: "setData";
			data: uPlot.AlignedData;
			resetScales?: boolean;
	  }
	| {
			type: "setSize";
			width: number;
			height: number;
	  }
	| {
			type: "setScale";
			key: string;
			min: number | null;
			max: number | null;
	  }
	| {
			type: "setSeries";
			index: number;
			opts: SeriesPatch;
	  }
	| {
			/** Mutate series visuals in place + redraw — cheaper than recreate. */
			type: "patchSeries";
			index: number;
			opts: SeriesVisualPatch;
	  }
	| {
			type: "setCursor";
			left: number;
			top: number;
	  }
	| {
			type: "setSelect";
			select: SelectRect;
	  }
	| {
			type: "batch";
			commands: readonly ChartCommand[];
	  };

export type ApplyResult = {
	recreated: boolean;
	applied: readonly ChartCommand[];
};
