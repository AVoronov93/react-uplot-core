import { WorkerWindowDemo } from "@ruplot/examples/demos/worker-window";
import type { Meta, StoryObj } from "@storybook/react";
import { demoDocs, hideChrome } from "./_demoDocs";

const meta = {
	title: "05 Data/Worker window",
	component: WorkerWindowDemo,
	args: { chrome: false },
	argTypes: hideChrome,
	parameters: demoDocs("worker-window"),
} satisfies Meta<typeof WorkerWindowDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	tags: ["!dev"],
};
