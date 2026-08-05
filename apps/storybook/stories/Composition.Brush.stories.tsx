import { BrushDemo } from "@ruplot/examples/demos/brush";
import type { Meta, StoryObj } from "@storybook/react";
import { demoDocs, hideChrome } from "./_demoDocs";

const meta = {
	title: "04 Composition/Brush",
	component: BrushDemo,
	args: {
		chrome: false,
		rangeMin: 120,
		rangeMax: 220,
		stroke: "#0ea5e9",
		variant: "both",
		gripWidth: 18,
	},
	argTypes: {
		...hideChrome,
		stroke: { control: "color" },
		variant: {
			control: { type: "radio" },
			options: ["both", "basic", "custom"],
		},
		rangeMin: { control: { type: "number", min: 0, max: 499, step: 1 } },
		rangeMax: { control: { type: "number", min: 1, max: 500, step: 1 } },
		gripWidth: { control: { type: "number", min: 6, max: 24, step: 1 } },
	},
	parameters: demoDocs("brush"),
} satisfies Meta<typeof BrushDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	tags: ["!dev"],
};

export const CustomGrips: Story = {
	tags: ["!dev"],
	args: { variant: "custom", gripWidth: 18 },
};
