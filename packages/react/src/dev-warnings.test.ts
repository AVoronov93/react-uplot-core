import type { RuplotPlugin } from "@ruplot/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { warnIfOptionsIdentityThrash, warnIfPluginsIdentityThrash } from "./dev-warnings.js";

describe("dev warnings", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("warns after repeated options identity changes", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const host = {};
		const a = { width: 1, height: 1, series: [{}] };
		const b = { width: 1, height: 1, series: [{}] };
		const c = { width: 1, height: 1, series: [{}] };
		const d = { width: 1, height: 1, series: [{}] };
		const e = { width: 1, height: 1, series: [{}] };

		warnIfOptionsIdentityThrash(host, a, b);
		warnIfOptionsIdentityThrash(host, b, c);
		warnIfOptionsIdentityThrash(host, c, d);
		expect(warn).not.toHaveBeenCalled();
		warnIfOptionsIdentityThrash(host, d, e);
		expect(warn).toHaveBeenCalledOnce();
		expect(String(warn.mock.calls[0]?.[0])).toMatch(/useChartOptions/);
	});

	it("warns after repeated plugins identity changes", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const host = {};
		const mk = (): RuplotPlugin[] => [{ key: "a", init: () => () => {} }];
		const p1 = mk();
		const p2 = mk();
		const p3 = mk();
		const p4 = mk();
		const p5 = mk();

		warnIfPluginsIdentityThrash(host, p1, p2);
		warnIfPluginsIdentityThrash(host, p2, p3);
		warnIfPluginsIdentityThrash(host, p3, p4);
		expect(warn).not.toHaveBeenCalled();
		warnIfPluginsIdentityThrash(host, p4, p5);
		expect(warn).toHaveBeenCalledOnce();
		expect(String(warn.mock.calls[0]?.[0])).toMatch(/plugins/);
	});
});
