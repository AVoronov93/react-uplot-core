import { StreamingWindowDemo } from "@ruplot/examples/demos/streaming-window";
import type { Meta, StoryObj } from "@storybook/react";
import { demoDocs, hideChrome } from "./_demoDocs";

const meta = {
	title: "05 Data/Streaming window",
	component: StreamingWindowDemo,
	args: { chrome: false, intervalMs: 250, stroke: "#0ea5e9" },
	argTypes: {
		...hideChrome,
		stroke: { control: "color" },
		intervalMs: { control: { type: "number", min: 100, max: 1000, step: 50 } },
	},
	parameters: demoDocs("streaming-window"),
} satisfies Meta<typeof StreamingWindowDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	tags: ["!dev"],
};
