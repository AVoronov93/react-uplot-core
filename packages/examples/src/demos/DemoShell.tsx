import type { ReactNode } from "react";

export type DemoShellProps = {
	/** When false, bare live region for Storybook. */
	chrome?: boolean;
	children: ReactNode;
};

/** Live chart block. Catalog/Storybook supply title/why outside. */
export function DemoShell({ chrome = true, children }: DemoShellProps) {
	return <div className={chrome ? "demo-live panel" : "demo-live"}>{children}</div>;
}
