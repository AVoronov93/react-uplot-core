import { TooltipDemo } from "@ruplot/examples/demos/tooltip";
import type { Meta, StoryObj } from "@storybook/react";
import { demoDocs, hideChrome } from "./_demoDocs";

const meta = {
	title: "04 Composition/Tooltip",
	component: TooltipDemo,
	args: {
		chrome: false,
		width: 720,
		height: 260,
		variant: "both",
		offsetX: 14,
		offsetY: 10,
	},
	argTypes: {
		...hideChrome,
		variant: {
			control: { type: "radio" },
			options: ["both", "basic", "custom"],
		},
		width: { control: { type: "number", min: 320, max: 1000, step: 10 } },
		height: { control: { type: "number", min: 120, max: 480, step: 10 } },
		offsetX: { control: { type: "number", min: 0, max: 40, step: 1 } },
		offsetY: { control: { type: "number", min: 0, max: 40, step: 1 } },
	},
	parameters: demoDocs("tooltip"),
} satisfies Meta<typeof TooltipDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	tags: ["!dev"],
};

export const CustomCard: Story = {
	tags: ["!dev"],
	args: { variant: "custom", offsetX: 18, offsetY: 12 },
};
