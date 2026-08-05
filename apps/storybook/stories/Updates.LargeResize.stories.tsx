import { LargeResizeDemo } from "@ruplot/examples/demos/large-resize";
import type { Meta, StoryObj } from "@storybook/react";
import { demoDocs, hideChrome } from "./_demoDocs";

const meta = {
	title: "03 Updates/Large + resize",
	component: LargeResizeDemo,
	args: {
		chrome: false,
		defaultPoints: 500_000,
		initialWidth: 720,
		initialHeight: 300,
		autoPan: true,
	},
	argTypes: {
		...hideChrome,
		defaultPoints: {
			control: { type: "number", min: 50_000, max: 2_000_000, step: 50_000 },
		},
		initialWidth: { control: { type: "number", min: 320, max: 1000, step: 10 } },
		initialHeight: { control: { type: "number", min: 160, max: 520, step: 10 } },
		autoPan: { control: { type: "boolean" } },
	},
	parameters: demoDocs("large-resize"),
} satisfies Meta<typeof LargeResizeDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	tags: ["!dev"],
};
