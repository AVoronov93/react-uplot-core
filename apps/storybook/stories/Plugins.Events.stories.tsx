import { EventsDemo } from "@ruplot/examples/demos/events";
import type { Meta, StoryObj } from "@storybook/react";
import { demoDocs, hideChrome } from "./_demoDocs";

const meta = {
	title: "06 Plugins/Events",
	component: EventsDemo,
	args: { chrome: false, stroke: "#0ea5e9" },
	argTypes: {
		...hideChrome,
		stroke: { control: "color" },
	},
	parameters: demoDocs("events"),
} satisfies Meta<typeof EventsDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	tags: ["!dev"],
};
