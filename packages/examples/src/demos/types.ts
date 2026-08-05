import type { ComponentType } from "react";

export type DemoCategory = "Getting started" | "Updates" | "Composition" | "Data" | "Plugins";

export type DemoId =
	| "basic"
	| "hooks"
	| "streaming"
	| "large"
	| "large-resize"
	| "large-resize-stream"
	| "resize-preserve"
	| "classifier"
	| "brush"
	| "sync"
	| "tooltip"
	| "dual-data"
	| "gaps-stepped"
	| "streaming-window"
	| "threshold"
	| "events"
	| "custom-plugin"
	| "series-visual"
	| "brush-pan-y"
	| "cursor-rich"
	| "stream-policy"
	| "auto-size"
	| "legend"
	| "brush-stream-lock"
	| "streaming-typed"
	| "worker-window"
	| "plugin-worker"
	| "axis-slots"
	| "multi-brush"
	| "ssr-hydrate";

export type DemoEntry = {
	id: DemoId;
	title: string;
	category: DemoCategory;
	blurb: string;
	why: string;
	pattern: string;
	pitfalls: readonly string[];
	Component: ComponentType<{ chrome?: boolean }>;
};

export const CATEGORY_ORDER: DemoCategory[] = [
	"Getting started",
	"Updates",
	"Composition",
	"Data",
	"Plugins",
];
