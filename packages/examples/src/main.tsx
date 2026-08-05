import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "uplot/dist/uPlot.min.css";
import { type DemoId, demosByCategory, getDemo } from "./demos/registry";
import "./styles.css";

function pageFromHash(): DemoId | null {
	const hash = window.location.hash.replace("#", "");
	if (!hash) return null;
	return getDemo(hash) ? (hash as DemoId) : null;
}

function CatalogHome({ onOpen }: { onOpen: (id: DemoId) => void }) {
	const groups = demosByCategory();
	return (
		<>
			<p className="lede">
				Interactive catalog of ruplot APIs — why each exists, the pattern, and live charts. Style
				inspired by{" "}
				<a
					href="https://leeoniya.github.io/uPlot/demos/index.html"
					target="_blank"
					rel="noreferrer"
				>
					uPlot demos
				</a>
				, focused on React integration (not every uPlot viz).
			</p>
			{groups.map(({ category, demos }) => (
				<section key={category} className="catalog-section">
					<h2 className="catalog-heading">{category}</h2>
					<ul className="catalog-list">
						{demos.map((d) => (
							<li key={d.id}>
								<button type="button" className="catalog-link" onClick={() => onOpen(d.id)}>
									{d.title}
								</button>
								<span className="catalog-blurb">{d.blurb}</span>
							</li>
						))}
					</ul>
				</section>
			))}
		</>
	);
}

function DemoPage({ id, onHome }: { id: DemoId; onHome: () => void }) {
	const demo = getDemo(id)!;
	const { Component } = demo;

	return (
		<>
			<nav className="demo-nav">
				<button type="button" className="tab" onClick={onHome}>
					← All demos
				</button>
				<span className="demo-nav-cat">{demo.category}</span>
			</nav>
			<header className="demo-header">
				<h1>{demo.title}</h1>
				<p className="lede">{demo.blurb}</p>
				<section className="demo-why">
					<h3>Why ruplot</h3>
					<p>{demo.why}</p>
				</section>
			</header>
			<Component chrome />
			<section className="demo-section panel" style={{ marginTop: 16 }}>
				<h3>Pattern</h3>
				<pre className="demo-code">
					<code>{demo.pattern}</code>
				</pre>
				<h3>Pitfalls</h3>
				<ul className="demo-pitfalls">
					{demo.pitfalls.map((p) => (
						<li key={p}>{p}</li>
					))}
				</ul>
			</section>
		</>
	);
}

function App() {
	const [demoId, setDemoId] = useState<DemoId | null>(() => pageFromHash());

	useEffect(() => {
		const onHash = () => setDemoId(pageFromHash());
		window.addEventListener("hashchange", onHash);
		return () => window.removeEventListener("hashchange", onHash);
	}, []);

	const go = (id: DemoId | null) => {
		window.location.hash = id ?? "";
		setDemoId(id);
	};

	return (
		<main className="page">
			<header>
				<p className="brand">ruplot</p>
				{demoId ? null : <h1>Demos</h1>}
			</header>
			{demoId ? (
				<DemoPage id={demoId} onHome={() => go(null)} />
			) : (
				<CatalogHome onOpen={(id) => go(id)} />
			)}
		</main>
	);
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
