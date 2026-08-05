import { CustomPluginDemo } from "@ruplot/examples/demos/custom-plugin";
import type { Meta, StoryObj } from "@storybook/react";
import { demoDocs, hideChrome } from "./_demoDocs";

const meta = {
	title: "06 Plugins/Custom plugin",
	component: CustomPluginDemo,
	args: { chrome: false, stroke: "#0ea5e9" },
	argTypes: {
		...hideChrome,
		stroke: { control: "color" },
	},
	parameters: demoDocs("custom-plugin"),
} satisfies Meta<typeof CustomPluginDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	tags: ["!dev"],
};
