import type uPlot from "uplot";
import type { SelectRect } from "./commands.js";

/**
 * Runtime UI state that must survive recreate / accidental options churn.
 */
export type RuntimeSnapshot = {
	scales: Record<string, { min: number | null; max: number | null }>;
	select: SelectRect;
	cursor: { left: number; top: number };
};

export function captureRuntimeSnapshot(instance: uPlot): RuntimeSnapshot {
	const scales: RuntimeSnapshot["scales"] = {};
	for (const key of Object.keys(instance.scales)) {
		const scale = instance.scales[key];
		if (!scale) continue;
		scales[key] = {
			min: scale.min ?? null,
			max: scale.max ?? null,
		};
	}

	return {
		scales,
		select: {
			left: instance.select.left,
			top: instance.select.top,
			width: instance.select.width,
			height: instance.select.height,
		},
		cursor: {
			left: instance.cursor.left ?? -10,
			top: instance.cursor.top ?? -10,
		},
	};
}

export function restoreRuntimeSnapshot(instance: uPlot, snap: RuntimeSnapshot): void {
	for (const [key, range] of Object.entries(snap.scales)) {
		if (range.min == null || range.max == null) continue;
		if (!(key in instance.scales)) continue;
		instance.setScale(key, { min: range.min, max: range.max });
	}

	if (snap.select.width > 0 || snap.select.height > 0) {
		instance.setSelect(snap.select, false);
	}

	if (snap.cursor.left >= 0 || snap.cursor.top >= 0) {
		instance.setCursor({ left: snap.cursor.left, top: snap.cursor.top }, false);
	}
}
