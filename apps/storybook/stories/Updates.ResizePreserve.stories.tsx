import { ResizePreserveDemo } from "@ruplot/examples/demos/resize-preserve";
import type { Meta, StoryObj } from "@storybook/react";
import { demoDocs, hideChrome } from "./_demoDocs";

const meta = {
	title: "03 Updates/Resize preserve",
	component: ResizePreserveDemo,
	args: {
		chrome: false,
		initialWidth: 720,
		zoomMin: 20,
		zoomMax: 60,
	},
	argTypes: {
		...hideChrome,
		initialWidth: { control: { type: "number", min: 320, max: 1000, step: 10 } },
		zoomMin: { control: { type: "number", min: 0, max: 99, step: 1 } },
		zoomMax: { control: { type: "number", min: 1, max: 100, step: 1 } },
	},
	parameters: demoDocs("resize-preserve"),
} satisfies Meta<typeof ResizePreserveDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	tags: ["!dev"],
};
