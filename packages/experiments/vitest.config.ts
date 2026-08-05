import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		name: "@ruplot/experiments",
		include: ["src/**/*.test.ts"],
		environment: "node",
	},
});
