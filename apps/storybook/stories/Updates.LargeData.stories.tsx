import { LargeDataDemo } from "@ruplot/examples/demos/large";
import type { Meta, StoryObj } from "@storybook/react";
import { demoDocs, hideChrome } from "./_demoDocs";

const meta = {
	title: "03 Updates/Large data",
	component: LargeDataDemo,
	args: {
		chrome: false,
		defaultPoints: 200_000,
		initialPhase: "dynamic",
	},
	argTypes: {
		...hideChrome,
		defaultPoints: {
			control: { type: "number", min: 50_000, max: 2_000_000, step: 50_000 },
			description: "Points to generate (URL ?points= still overrides in examples app)",
		},
		initialPhase: {
			control: { type: "radio" },
			options: ["static", "dynamic"],
			description: "After generate: full overview or animated setScale pan",
		},
	},
	parameters: demoDocs("large"),
} satisfies Meta<typeof LargeDataDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DynamicZoom: Story = {
	tags: ["!dev"],
};

export const StaticOverview: Story = {
	tags: ["!dev"],
	args: { initialPhase: "static" },
};
