import {describe, it, expect, beforeEach, vi} from "vitest";
import {PrometheusRemoteWrite} from "../prometheusremotewrite";
import {Event} from "../../index";
import {pushMetrics, pushTimeseries} from "prometheus-remote-write";

vi.mock("prometheus-remote-write", () => ({
pushMetrics: vi.fn().mockResolvedValue({status: 200, statusText: "OK"}),
pushTimeseries: vi.fn().mockResolvedValue({status: 200, statusText: "OK"})
}));

describe("PrometheusRemoteWrite", () => {
beforeEach(() => {
vi.clearAllMocks();
});

it("pushes metric maps using pushMetrics", async () => {
const output = new PrometheusRemoteWrite({
url: "http://localhost:9201",
labels: {service: "queue-worker"}
});
const event: Event = {
time: new Date(),
event: {
queue_depth_total: 100
}
};

await new Promise<void>((resolve, reject) => {
output._write(event, "utf-8", (error?: Error | null) => {
if (error) {
reject(error);
return;
}

resolve();
});
});

	expect(pushMetrics).toHaveBeenCalledWith(
		{queue_depth_total: 100},
		expect.objectContaining({
			url: "http://localhost:9201",
			labels: {service: "queue-worker"},
			fetch: expect.any(Function)
		})
	);
expect(pushTimeseries).not.toHaveBeenCalled();
});

it("pushes timeseries payloads using pushTimeseries when mode is timeseries", async () => {
const output = new PrometheusRemoteWrite({
url: "http://localhost:9201",
mode: "timeseries"
});
const event: Event = {
time: new Date(),
event: {
labels: {
__name__: "queue_depth_total",
service: "SQS"
},
samples: [{value: 150, timestamp: Date.now()}]
}
};

await new Promise<void>((resolve, reject) => {
output._write(event, "utf-8", (error?: Error | null) => {
if (error) {
reject(error);
return;
}

resolve();
});
});

	expect(pushTimeseries).toHaveBeenCalledWith(
		event.event,
		expect.objectContaining({
			url: "http://localhost:9201",
			fetch: expect.any(Function)
		})
	);
expect(pushMetrics).not.toHaveBeenCalled();
});

it("returns an error for invalid metric payloads", async () => {
const output = new PrometheusRemoteWrite({url: "http://localhost:9201"});
const event: Event = {
time: new Date(),
event: {
queue_depth_total: "not-a-number"
}
};

await expect(new Promise<void>((resolve, reject) => {
output._write(event, "utf-8", (error?: Error | null) => {
if (error) {
reject(error);
return;
}

resolve();
});
})).rejects.toThrow("Prometheus metrics payload must be an object whose values are numbers");
expect(pushMetrics).not.toHaveBeenCalled();
});
});
