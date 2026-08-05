import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, "..");

async function exists(file) {
	try {
		await access(file);
		return true;
	} catch {
		return false;
	}
}

function run(command, args, cwd = pkgRoot) {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, {
			cwd,
			stdio: "inherit",
			shell: true,
			env: process.env,
		});
		child.on("error", reject);
		child.on("close", (code) => resolve(code ?? 1));
	});
}

const chromiumOk = await exists(
	path.join(pkgRoot, "node_modules", "@playwright", "test", "package.json"),
);

if (!chromiumOk) {
	console.error("Playwright is not installed. Run pnpm install from the repo root.");
	process.exit(1);
}

console.log("Ensuring Chromium for Playwright…");
const installCode = await run("pnpm", ["exec", "playwright", "install", "chromium"]);
if (installCode !== 0) {
	console.warn("playwright install exited non-zero; continuing in case browser already present");
}

console.log("Running benchmark suite…");
const code = await run("pnpm", ["exec", "playwright", "test"]);
if (code !== 0) {
	process.exit(code);
}

console.log("Comparing against baseline.json…");
const compareCode = await run("node", ["./src/compare-baseline.mjs"]);
process.exit(compareCode);
