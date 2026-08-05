import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		name: "@ruplot/react",
		environment: "jsdom",
		include: ["src/**/*.test.tsx", "src/**/*.test.ts"],
		setupFiles: ["./src/test-setup.ts"],
	},
});
