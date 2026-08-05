import { Chart, streamingWindowTransferable } from "@ruplot/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type uPlot from "uplot";
import { CHART_H, CHART_W } from "../shared/data.js";
import { DemoShell } from "./DemoShell.js";
const CAPACITY = 160;
const seed = (): Float64Array[] => { const x = Float64Array.from({ length: CAPACITY }, (_, i) => i); return [x, Float64Array.from(x, (i) => Math.sin(i / 9) * 8 + 10)]; };
export function WorkerWindowDemo({ chrome = true }: { chrome?: boolean }) {
	const [data, setData] = useState(seed); const tick = useRef(CAPACITY);
	const options = useMemo<uPlot.Options>(() => ({ width: CHART_W, height: CHART_H, scales: { x: { time: false } }, legend: { show: false }, series: [{}, { stroke: "#a855f7", width: 2 }] }), []);
	useEffect(() => { const id = setInterval(() => { const t = ++tick.current; setData((prev) => streamingWindowTransferable({ buffer: prev, chunk: [Float64Array.of(t), Float64Array.of(Math.sin(t / 9) * 8 + 10)], capacity: CAPACITY, typed: true }) as Float64Array[]); }, 300); return () => clearInterval(id); }, []);
	return <DemoShell chrome={chrome}><p className="panel-note"><strong>Experiment:</strong> this working main-thread example uses <code>streamingWindowTransferable</code>. <code>@ruplot/experiments</code> provides <code>createDataWorker</code> when a Vite worker URL is available, moving window concatenation off the paint thread.</p><Chart data={data as uPlot.AlignedData} options={options} streaming={{ enabled: true, follow: true }} /></DemoShell>;
}
