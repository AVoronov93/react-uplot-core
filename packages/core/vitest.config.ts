import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		name: "@ruplot/core",
		environment: "node",
		include: ["src/**/*.test.ts"],
		setupFiles: ["./src/test-setup.ts"],
	},
});
