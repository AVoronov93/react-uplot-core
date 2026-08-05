import path from "node:path";

// Plain JS: Storybook loads main via CJS interop; .ts + esbuild-register
// injects a broken `require` polyfill for import.meta under Node ESM.
const demosRoot = path.resolve(process.cwd(), "../../packages/examples/src");

/** @type {import('@storybook/react-vite').StorybookConfig} */
const config = {
	stories: ["../stories/**/*.mdx", "../stories/**/*.stories.@(ts|tsx)"],
	addons: ["@storybook/addon-essentials"],
	framework: {
		name: "@storybook/react-vite",
		options: {},
	},
	async viteFinal(viteConfig) {
		const base = process.env.STORYBOOK_BASE_PATH ?? "/";
		viteConfig.base = base;
		viteConfig.optimizeDeps = {
			...viteConfig.optimizeDeps,
			include: [
				...(viteConfig.optimizeDeps?.include ?? []),
				"uplot",
				"uplot-react",
				"react-uplot",
			],
		};
		viteConfig.resolve = {
			...viteConfig.resolve,
			alias: {
				...(viteConfig.resolve?.alias ?? {}),
				"@ruplot/examples": demosRoot,
			},
		};
		return viteConfig;
	},
};

export default config;
