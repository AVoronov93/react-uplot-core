import { Chart, type ChartRef } from "@ruplot/react";
import {
	Profiler,
	type ReactNode,
	type RefObject,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { UPlot } from "react-uplot";
import uPlot from "uplot";
import UplotReact from "uplot-react";

const POINTS = 400;
const W = 340;
const H = 160;

function makeBuffer(): uPlot.AlignedData {
	const x = new Float64Array(POINTS);
	const y = new Float64Array(POINTS);
	for (let i = 0; i < POINTS; i++) {
		x[i] = i;
		y[i] = Math.sin(i / 18) * 12 + Math.sin(i / 7) * 3;
	}
	return [x, y];
}

function advance(data: uPlot.AlignedData, tick: number): void {
	const x = data[0] as Float64Array;
	const y = data[1] as Float64Array;
	const last = POINTS - 1;
	x.copyWithin(0, 1);
	y.copyWithin(0, 1);
	x[last] = x[last - 1]! + 1;
	y[last] = Math.sin((tick + POINTS) / 18) * 12 + Math.sin((tick + POINTS) / 7) * 3;
}

function cloneAsArrays(src: uPlot.AlignedData): uPlot.AlignedData {
	const x = src[0] as Float64Array;
	const y = src[1] as Float64Array;
	return [Array.from(x), Array.from(y)];
}

function baseOptions(title: string): uPlot.Options {
	return {
		width: W,
		height: H,
		title,
		series: [{}, { label: "Live", stroke: "#0ea5e9", width: 2, points: { show: false } }],
		scales: { x: { time: false } },
		legend: { show: false },
		cursor: { show: false },
	};
}

function CommitProbe({
	id,
	children,
	onCommit,
}: {
	id: string;
	children: ReactNode;
	onCommit: () => void;
}) {
	return (
		<Profiler id={id} onRender={() => onCommit()}>
			{children}
		</Profiler>
	);
}

function LaneShell({
	name,
	note,
	commitsEl,
	fpsEl,
	children,
}: {
	name: string;
	note: string;
	commitsEl: RefObject<HTMLSpanElement | null>;
	fpsEl: RefObject<HTMLSpanElement | null>;
	children: ReactNode;
}) {
	return (
		<div
			style={{
				border: "1px solid #cbd5e1",
				borderRadius: 8,
				padding: 12,
				background: "#fff",
				minWidth: 0,
			}}
		>
			<div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
				<strong style={{ fontSize: 14 }}>{name}</strong>
				<span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums", display: "flex", gap: 10 }}>
					<span>
						FPS{" "}
						<span ref={fpsEl} style={{ fontWeight: 700 }}>
							—
						</span>
					</span>
					<span>
						commits{" "}
						<span ref={commitsEl} style={{ fontWeight: 700 }}>
							0
						</span>
					</span>
				</span>
			</div>
			<p style={{ margin: "0 0 8px", fontSize: 12, color: "#64748b" }}>{note}</p>
			{children}
		</div>
	);
}

type FpsRefs = {
	el: RefObject<HTMLSpanElement | null>;
	frames: { current: number };
	lastAt: { current: number };
};

function tickFps(fps: FpsRefs, now: number) {
	fps.frames.current += 1;
	const elapsed = now - fps.lastAt.current;
	if (elapsed >= 500) {
		if (fps.el.current) {
			fps.el.current.textContent = ((fps.frames.current / elapsed) * 1000).toFixed(0);
		}
		fps.frames.current = 0;
		fps.lastAt.current = now;
	}
}

function RuplotLane({ running, hz }: { running: boolean; hz: number }) {
	const chartRef = useRef<ChartRef>(null);
	const dataRef = useRef(makeBuffer());
	const tick = useRef(0);
	const commits = useRef(0);
	const commitsEl = useRef<HTMLSpanElement>(null);
	const fps: FpsRefs = {
		el: useRef<HTMLSpanElement>(null),
		frames: useRef(0),
		lastAt: useRef(performance.now()),
	};
	const options = useMemo(() => baseOptions("@ruplot/react"), []);

	useLayoutEffect(() => {
		if (!running) return;
		let raf = 0;
		let last = performance.now();
		const interval = 1000 / hz;
		const loop = (now: number) => {
			tickFps(fps, now);
			if (now - last >= interval) {
				last = now;
				tick.current += 1;
				advance(dataRef.current, tick.current);
				const chart = chartRef.current?.getInstance();
				if (chart) {
					const x = dataRef.current[0] as Float64Array;
					chart.setData(dataRef.current, false);
					chart.setScale("x", { min: x[0]!, max: x[x.length - 1]! });
				}
			}
			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(raf);
		// fps holds stable refs
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [running, hz]);

	return (
		<LaneShell
			name="@ruplot/react"
			note="Imperative setData + setScale — React stays quiet."
			commitsEl={commitsEl}
			fpsEl={fps.el}
		>
			<CommitProbe
				id="cmp-ruplot"
				onCommit={() => {
					commits.current += 1;
					if (commitsEl.current) commitsEl.current.textContent = String(commits.current);
				}}
			>
				<Chart
					ref={chartRef}
					data={dataRef.current}
					options={options}
					streaming={{ enabled: true, follow: true, resetScales: false }}
				/>
			</CommitProbe>
		</LaneShell>
	);
}

function BaselineLane({ running, hz }: { running: boolean; hz: number }) {
	const hostRef = useRef<HTMLDivElement>(null);
	const instance = useRef<uPlot | null>(null);
	const dataRef = useRef(makeBuffer());
	const tick = useRef(0);
	const commitsEl = useRef<HTMLSpanElement>(null);
	const fps: FpsRefs = {
		el: useRef<HTMLSpanElement>(null),
		frames: useRef(0),
		lastAt: useRef(performance.now()),
	};

	useEffect(() => {
		const host = hostRef.current;
		if (!host) return;
		instance.current?.destroy();
		host.replaceChildren();
		instance.current = new uPlot(baseOptions("baseline uPlot"), dataRef.current, host);
		return () => {
			instance.current?.destroy();
			instance.current = null;
			host.replaceChildren();
		};
	}, []);

	useLayoutEffect(() => {
		if (!running) return;
		let raf = 0;
		let last = performance.now();
		const interval = 1000 / hz;
		const loop = (now: number) => {
			tickFps(fps, now);
			if (now - last >= interval) {
				last = now;
				tick.current += 1;
				advance(dataRef.current, tick.current);
				const chart = instance.current;
				if (chart) {
					const x = dataRef.current[0] as Float64Array;
					chart.setData(dataRef.current, false);
					chart.setScale("x", { min: x[0]!, max: x[x.length - 1]! });
				}
			}
			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(raf);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [running, hz]);

	return (
		<LaneShell
			name="baseline uPlot"
			note="Raw new uPlot() — no React commits by design."
			commitsEl={commitsEl}
			fpsEl={fps.el}
		>
			<div ref={hostRef} />
		</LaneShell>
	);
}

function UplotReactLane({ running, hz }: { running: boolean; hz: number }) {
	const buffer = useRef(makeBuffer());
	const tick = useRef(0);
	const [data, setData] = useState(() => cloneAsArrays(buffer.current));
	const options = useMemo(() => baseOptions("uplot-react"), []);
	const commits = useRef(0);
	const commitsEl = useRef<HTMLSpanElement>(null);
	const fps: FpsRefs = {
		el: useRef<HTMLSpanElement>(null),
		frames: useRef(0),
		lastAt: useRef(performance.now()),
	};

	useLayoutEffect(() => {
		if (!running) return;
		let raf = 0;
		let last = performance.now();
		const interval = 1000 / hz;
		const loop = (now: number) => {
			tickFps(fps, now);
			if (now - last >= interval) {
				last = now;
				tick.current += 1;
				advance(buffer.current, tick.current);
				setData(cloneAsArrays(buffer.current));
			}
			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(raf);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [running, hz]);

	return (
		<LaneShell
			name="uplot-react"
			note="Prop data each tick + resetScales (stable options). React commits every tick."
			commitsEl={commitsEl}
			fpsEl={fps.el}
		>
			<CommitProbe
				id="cmp-uplot-react"
				onCommit={() => {
					commits.current += 1;
					if (commitsEl.current) commitsEl.current.textContent = String(commits.current);
				}}
			>
				<UplotReact data={data} options={options} resetScales />
			</CommitProbe>
		</LaneShell>
	);
}

function ReactUplotLane({ running, hz }: { running: boolean; hz: number }) {
	const buffer = useRef(makeBuffer());
	const tick = useRef(0);
	const chartRef = useRef<uPlot | null>(null);
	const [data, setData] = useState(() => cloneAsArrays(buffer.current));
	const options = useMemo(() => baseOptions("react-uplot"), []);
	const commits = useRef(0);
	const commitsEl = useRef<HTMLSpanElement>(null);
	const fps: FpsRefs = {
		el: useRef<HTMLSpanElement>(null),
		frames: useRef(0),
		lastAt: useRef(performance.now()),
	};

	useLayoutEffect(() => {
		if (!running) return;
		let raf = 0;
		let last = performance.now();
		const interval = 1000 / hz;
		const loop = (now: number) => {
			tickFps(fps, now);
			if (now - last >= interval) {
				last = now;
				tick.current += 1;
				advance(buffer.current, tick.current);
				setData(cloneAsArrays(buffer.current));
			}
			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(raf);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [running, hz]);

	return (
		<LaneShell
			name="react-uplot"
			note="New data identity each tick → React commits / often recreate."
			commitsEl={commitsEl}
			fpsEl={fps.el}
		>
			<CommitProbe
				id="cmp-react-uplot"
				onCommit={() => {
					commits.current += 1;
					if (commitsEl.current) commitsEl.current.textContent = String(commits.current);
				}}
			>
				<UPlot data={data} options={options} chartRef={chartRef} />
			</CommitProbe>
		</LaneShell>
	);
}

export type StreamCompareProps = {
	running?: boolean;
	hz?: number;
};

export function StreamCompare({ running = true, hz = 30 }: StreamCompareProps) {
	return (
		<div style={{ fontFamily: "system-ui", maxWidth: 760 }}>
			<p style={{ marginTop: 0, lineHeight: 1.45, color: "#334155" }}>
				Same sliding window @ {hz}Hz. <strong>FPS</strong> = real paint loop rate;{" "}
				<strong>commits</strong> = React Profiler renders. ruplot / baseline: high FPS, ~0 commits.
				Competitors: commits climb with every tick.
			</p>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "1fr 1fr",
					gap: 12,
				}}
			>
				<RuplotLane running={running} hz={hz} />
				<BaselineLane running={running} hz={hz} />
				<UplotReactLane running={running} hz={hz} />
				<ReactUplotLane running={running} hz={hz} />
			</div>
		</div>
	);
}
