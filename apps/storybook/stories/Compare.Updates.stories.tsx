import type { Meta, StoryObj } from "@storybook/react";
import { UpdateCompare } from "./compare/UpdateCompare";

const meta = {
	title: "07 Compare/Stroke patch",
	component: UpdateCompare,
	parameters: {
		docs: {
			description: {
				component:
					"Side-by-side stroke toggle: **@ruplot/react** (`patchSeries`, `onReady` once), **uplot-react** (`onCreate` remounts), **react-uplot** (recreate via options deps). **remounts** count chart creates.",
			},
		},
	},
} satisfies Meta<typeof UpdateCompare>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeWays: Story = {
	tags: ["!dev"],
};
