import { describe, expect, it, vi } from "vitest";
import {
	collectUPlotPlugins,
	createPlugin,
	createPluginRuntime,
	objectSeriesPaths,
	pluginKeysSignature,
	thresholdPlugin,
} from "./index.js";

describe("PluginRuntime", () => {
	it("inits, diffs by key, and cleans up", () => {
		const runtime = createPluginRuntime();
		const cleanA = vi.fn();
		const cleanB = vi.fn();
		const initA = vi.fn(() => cleanA);
		const initB = vi.fn(() => cleanB);

		const session = {} as never;
		const u = {} as never;

		runtime.sync(
			[
				createPlugin({ key: "a", init: initA }),
				createPlugin({ key: "b", init: initB }),
			],
			{ u, session },
		);

		expect(initA).toHaveBeenCalledOnce();
		expect(initB).toHaveBeenCalledOnce();
		expect(runtime.activeKeys.slice().sort()).toEqual(["a", "b"]);

		runtime.sync([createPlugin({ key: "a", init: initA })], { u, session });
		expect(cleanB).toHaveBeenCalledOnce();
		expect(runtime.activeKeys).toEqual(["a"]);

		runtime.destroy();
		expect(cleanA).toHaveBeenCalledOnce();
		expect(runtime.activeKeys).toEqual([]);
	});
});

describe("thresholdPlugin", () => {
	it("exposes a stable key and native draw hook", () => {
		const plugin = thresholdPlugin({ y: 80, stroke: "#f00" });
		expect(plugin.key).toBe("threshold:y:80");
		expect(plugin.uplot?.hooks.draw).toBeTruthy();
		expect(collectUPlotPlugins([plugin])).toHaveLength(1);
		expect(pluginKeysSignature([plugin])).toBe("threshold:y:80");
	});
});

describe("objectSeriesPaths", () => {
	it("returns a PathBuilder function", () => {
		const paths = objectSeriesPaths<{ color: string }>({
			get: () => ({ color: "#0ea5e9" }),
			render: () => {},
		});
		expect(paths).toBeTypeOf("function");
	});
});
