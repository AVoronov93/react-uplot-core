import { SsrHydrateDemo } from "@ruplot/examples/demos/ssr-hydrate";
import type { Meta, StoryObj } from "@storybook/react";
import { demoDocs, hideChrome } from "./_demoDocs";

const meta = {
	title: "03 Updates/SSR hydrate",
	component: SsrHydrateDemo,
	args: { chrome: false },
	argTypes: hideChrome,
	parameters: demoDocs("ssr-hydrate"),
} satisfies Meta<typeof SsrHydrateDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	tags: ["!dev"],
};
