import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./src",
	fullyParallel: false,
	workers: 1,
	retries: 0,
	timeout: 120_000,
	reporter: [["list"], ["./src/reporter.ts"]],
	use: {
		baseURL: "http://127.0.0.1:5177",
		trace: "off",
		video: "off",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	webServer: {
		command:
			"pnpm exec vite --config harness/vite.config.ts --host 127.0.0.1 --port 5177 --strictPort",
		url: "http://127.0.0.1:5177",
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
	},
});
