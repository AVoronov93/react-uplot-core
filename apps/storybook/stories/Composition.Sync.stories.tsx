import { SyncDemo } from "@ruplot/examples/demos/sync";
import type { Meta, StoryObj } from "@storybook/react";
import { demoDocs, hideChrome } from "./_demoDocs";

const meta: Meta<typeof SyncDemo> = {
	title: "04 Composition/Sync",
	component: SyncDemo,
	args: { chrome: false, strokeA: "#0ea5e9", strokeB: "#f97316" },
	argTypes: {
		...hideChrome,
		strokeA: { control: "color" },
		strokeB: { control: "color" },
	},
	parameters: demoDocs("sync"),
};

export default meta;
type Story = StoryObj<typeof SyncDemo>;

export const Playground: Story = {
	tags: ["!dev"],
};
