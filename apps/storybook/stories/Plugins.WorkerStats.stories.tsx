import { PluginWorkerDemo } from "@ruplot/examples/demos/plugin-worker";
import type { Meta, StoryObj } from "@storybook/react";
import { demoDocs, hideChrome } from "./_demoDocs";

const meta = {
	title: "06 Plugins/Worker stats",
	component: PluginWorkerDemo,
	args: { chrome: false, noise: 1.5 },
	argTypes: {
		...hideChrome,
		noise: { control: { type: "number", min: 0, max: 4, step: 0.5 } },
	},
	parameters: demoDocs("plugin-worker"),
} satisfies Meta<typeof PluginWorkerDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	tags: ["!dev"],
};
