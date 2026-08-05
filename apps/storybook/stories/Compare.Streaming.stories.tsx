import type { Meta, StoryObj } from "@storybook/react";
import { StreamCompare } from "./compare/StreamCompare";

const meta = {
	title: "07 Compare/Streaming commits",
	component: StreamCompare,
	args: {
		running: true,
		hz: 30,
	},
	argTypes: {
		running: { control: { type: "boolean" }, description: "Pause / resume all lanes" },
		hz: {
			control: { type: "range", min: 5, max: 60, step: 5 },
			description: "Target ingest rate (Hz)",
		},
	},
	parameters: {
		docs: {
			description: {
				component:
					"Side-by-side streaming: **@ruplot/react**, raw **uPlot**, **uplot-react**, and **react-uplot**. **FPS** from the rAF loop; **commits** from React Profiler.",
			},
		},
	},
} satisfies Meta<typeof StreamCompare>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FourWays: Story = {
	tags: ["!dev"],
};
