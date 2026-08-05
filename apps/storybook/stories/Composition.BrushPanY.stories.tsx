import { BrushPanYDemo } from "@ruplot/examples/demos/brush-pan-y";
import type { Meta, StoryObj } from "@storybook/react";
import { demoDocs, hideChrome } from "./_demoDocs";

const meta = {
	title: "04 Composition/Brush pan Y",
	component: BrushPanYDemo,
	args: {
		chrome: false,
		xMin: 80,
		xMax: 180,
		yMin: 14,
		yMax: 28,
	},
	argTypes: {
		...hideChrome,
		xMin: { control: { type: "number", min: 0, max: 299, step: 1 } },
		xMax: { control: { type: "number", min: 1, max: 300, step: 1 } },
		yMin: { control: { type: "number", min: 0, max: 40, step: 0.5 } },
		yMax: { control: { type: "number", min: 0, max: 40, step: 0.5 } },
	},
	parameters: demoDocs("brush-pan-y"),
} satisfies Meta<typeof BrushPanYDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	tags: ["!dev"],
};
