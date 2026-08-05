import { StreamingDemo } from "@ruplot/examples/demos/streaming";
import type { Meta, StoryObj } from "@storybook/react";
import { demoDocs, hideChrome } from "./_demoDocs";

const meta = {
	title: "03 Updates/Streaming",
	component: StreamingDemo,
	args: { chrome: false, autoStart: true },
	argTypes: {
		...hideChrome,
		autoStart: { control: "boolean", description: "Start the 60Hz ingest loop on mount" },
	},
	parameters: demoDocs("streaming"),
} satisfies Meta<typeof StreamingDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	tags: ["!dev"],
};
