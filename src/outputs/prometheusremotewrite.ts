import {pushMetrics, pushTimeseries} from "prometheus-remote-write";
import {AbstractOutput} from "./index";
import {Event} from "../index";

type MetricMap = Record<string, number>;

type Timeseries = {
	labels: {
		__name__: string;
		[key: string]: string;
	};
	samples: Array<{
		value: number;
		timestamp?: number;
	}>;
};

type RemoteWriteFetch = (
	url: string,
	init?: {
		method: string;
		headers: Record<string, string>;
		timeout?: number;
		body: ArrayBufferLike;
	}
) => Promise<{ status: number; statusText: string; text: () => Promise<string> }>;

export interface PrometheusRemoteWriteConfig {
	url: string;
	auth?: {
		username?: string;
		password?: string;
	};
	labels?: Record<string, string>;
	headers?: Record<string, string>;
	timeout?: number;
	mode?: "metrics" | "timeseries";
	fetch?: RemoteWriteFetch;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isMetricMap(value: unknown): value is MetricMap {
	if (!isRecord(value)) {
		return false;
	}

	return Object.values(value).every(v => typeof v === "number" && Number.isFinite(v));
}

function isTimeseries(value: unknown): value is Timeseries {
	if (!isRecord(value) || !isRecord(value.labels) || !Array.isArray(value.samples)) {
		return false;
	}

	if (typeof value.labels.__name__ !== "string") {
		return false;
	}

	return value.samples.every(sample => isRecord(sample) && typeof sample.value === "number");
}

function isTimeseriesPayload(value: unknown): value is Timeseries | Timeseries[] {
	return Array.isArray(value) ? value.every(isTimeseries) : isTimeseries(value);
}

const defaultFetch: RemoteWriteFetch = async (url, init) => {
	const response = await fetch(url, {
		method: init?.method,
		headers: init?.headers,
		body: init?.body as BodyInit
	});

	return {
		status: response.status,
		statusText: response.statusText,
		text: () => response.text()
	};
};

/**
 * Writes events to a Prometheus remote_write endpoint.
 */
export class PrometheusRemoteWrite extends AbstractOutput {
	constructor(protected readonly config: PrometheusRemoteWriteConfig) {
		super();
	}

	_write(event: Event, _encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
		const {mode = "metrics", ...cfg} = this.config;
		const options = {...cfg, fetch: cfg.fetch ?? defaultFetch};
		const payload = event.event;

		const write = mode === "timeseries"
			? this.pushTimeseriesPayload(payload, options)
			: this.pushMetricPayload(payload, options);

		write
			.then(() => callback())
			.catch((error: unknown) => callback(error instanceof Error ? error : new Error(String(error))));
	}

	private async pushMetricPayload(payload: unknown, options: Omit<PrometheusRemoteWriteConfig, "mode">): Promise<void> {
		if (!isMetricMap(payload)) {
			throw new Error("Prometheus metrics payload must be an object whose values are numbers");
		}

		await pushMetrics(payload, options);
	}

	private async pushTimeseriesPayload(payload: unknown, options: Omit<PrometheusRemoteWriteConfig, "mode">): Promise<void> {
		if (!isTimeseriesPayload(payload)) {
			throw new Error("Prometheus timeseries payload must match the remote_write timeseries format");
		}

		await pushTimeseries(payload, options);
	}
}
