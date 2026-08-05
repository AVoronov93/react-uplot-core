if (typeof window === "undefined" || typeof HTMLCanvasElement === "undefined") {
	// Node unit tests — skip jsdom canvas stubs.
} else {
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: (query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => false,
	}),
});

class Path2DStub {
	addPath() {}
	closePath() {}
	moveTo() {}
	lineTo() {}
	bezierCurveTo() {}
	quadraticCurveTo() {}
	arc() {}
	arcTo() {}
	ellipse() {}
	rect() {}
}

(
	globalThis as typeof globalThis & {
		Path2D: typeof Path2DStub;
	}
).Path2D = Path2DStub;

function createStubContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
	const state: Record<string, unknown> = {
		canvas,
		fillStyle: "",
		strokeStyle: "",
		lineWidth: 1,
		font: "",
		globalAlpha: 1,
	};

	return new Proxy(state, {
		get(target, prop) {
			if (prop in target) return target[prop as string];
			if (prop === "measureText") return () => ({ width: 0 });
			if (prop === "getImageData") return () => ({ data: new Uint8ClampedArray(4) });
			if (prop === "createLinearGradient") return () => ({ addColorStop: () => {} });
			if (prop === "getLineDash") return () => [];
			return () => {};
		},
		set(target, prop, value) {
			target[prop as string] = value;
			return true;
		},
	}) as unknown as CanvasRenderingContext2D;
}

HTMLCanvasElement.prototype.getContext = function getContext() {
	return createStubContext(this);
};
}
