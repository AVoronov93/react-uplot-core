import { addons } from "@storybook/manager-api";

addons.setConfig({
	docs: {
		/** Sidebar leaf under each demo — not a nested generic "Docs". */
		defaultName: "Demo",
	},
});
