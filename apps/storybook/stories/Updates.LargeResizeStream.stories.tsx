import { LargeResizeStreamDemo } from "@ruplot/examples/demos/large-resize-stream";
import type { Meta, StoryObj } from "@storybook/react";
import { demoDocs, hideChrome } from "./_demoDocs";

const meta = {
	title: "03 Updates/Large + resize + stream",
	component: LargeResizeStreamDemo,
	args: {
		chrome: false,
		defaultPoints: 200_000,
		initialWidth: 720,
		initialHeight: 300,
		hz: 60,
		autoStart: true,
	},
	argTypes: {
		...hideChrome,
		defaultPoints: {
			control: { type: "number", min: 50_000, max: 1_000_000, step: 50_000 },
			description: "Sliding-window capacity",
		},
		initialWidth: { control: { type: "number", min: 320, max: 1000, step: 10 } },
		initialHeight: { control: { type: "number", min: 160, max: 520, step: 10 } },
		hz: { control: { type: "range", min: 5, max: 60, step: 5 } },
		autoStart: { control: { type: "boolean" } },
	},
	parameters: demoDocs("large-resize-stream"),
} satisfies Meta<typeof LargeResizeStreamDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	tags: ["!dev"],
};
