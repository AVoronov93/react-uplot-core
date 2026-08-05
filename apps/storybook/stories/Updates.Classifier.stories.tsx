import { ClassifierDemo } from "@ruplot/examples/demos/classifier";
import type { Meta, StoryObj } from "@storybook/react";
import { demoDocs, hideChrome } from "./_demoDocs";

const meta = {
	title: "03 Updates/Classifier",
	component: ClassifierDemo,
	args: { chrome: false, initialMode: "stroke" },
	argTypes: {
		...hideChrome,
		initialMode: {
			control: { type: "radio" },
			options: ["data", "stroke", "size", "title"],
		},
	},
	parameters: demoDocs("classifier"),
} satisfies Meta<typeof ClassifierDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	tags: ["!dev"],
};
