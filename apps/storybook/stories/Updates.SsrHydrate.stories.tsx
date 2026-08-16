import { SsrHydrateDemo } from "@ruplot/examples/demos/ssr-hydrate";
import type { Meta, StoryObj } from "@storybook/react";
import { demoDocs, hideChrome } from "./_demoDocs";

const meta = {
	title: "03 Updates/SSR hydrate",
	component: SsrHydrateDemo,
	args: { chrome: false },
	argTypes: hideChrome,
	parameters: demoDocs("ssr-hydrate", {
		story:
			"Pre-create `createChartStores()`, render HUD from `getServerSnapshot` on the server, then pass the same `stores` into `<Chart stores={stores} />` on the client. See Overview → API → SSR / hydrate.",
	}),
} satisfies Meta<typeof SsrHydrateDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
	tags: ["!dev"],
};
