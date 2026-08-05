import { StreamPolicyDemo } from "@ruplot/examples/demos/stream-policy";
import type { Meta, StoryObj } from "@storybook/react";
import { demoDocs, hideChrome } from "./_demoDocs";

const meta = {
	title: "05 Data/Stream policy",
	component: StreamPolicyDemo,
	args: { chrome: false },
	argTypes: hideChrome,
	parameters: demoDocs("stream-policy"),
} satisfies Meta<typeof StreamPolicyDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	tags: ["!dev"],
};
