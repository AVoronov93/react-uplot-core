import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	root,
	plugins: [react()],
	server: {
		port: 5177,
		strictPort: true,
	},
	build: {
		outDir: path.resolve(root, "../dist-harness"),
		emptyOutDir: true,
	},
	resolve: {
		dedupe: ["react", "react-dom", "uplot"],
	},
	optimizeDeps: {
		include: ["uplot", "uplot-react", "react-uplot"],
	},
});
