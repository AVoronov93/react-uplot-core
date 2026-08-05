import { StreamingTypedDemo } from "@ruplot/examples/demos/streaming-typed";
import type { Meta, StoryObj } from "@storybook/react";
import { demoDocs, hideChrome } from "./_demoDocs";

const meta = {
	title: "05 Data/Streaming typed",
	component: StreamingTypedDemo,
	args: { chrome: false },
	argTypes: hideChrome,
	parameters: demoDocs("streaming-typed"),
} satisfies Meta<typeof StreamingTypedDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	tags: ["!dev"],
};
