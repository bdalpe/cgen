import {mkdtempSync, readFileSync, rmSync} from "node:fs";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {finished} from "node:stream/promises";
import {afterEach, describe, expect, it} from "vitest";
import {File} from "../file";
import type {Event} from "../../index";

const encoding: BufferEncoding = "utf-8";

describe("File", () => {
	let directory: string | undefined;

	afterEach(() => {
		if (directory) {
			rmSync(directory, {recursive: true, force: true});
			directory = undefined;
		}
	});

	function newFileOutput(config: {maxFileSize?: number; maxFiles?: number} = {}): {output: File; path: string} {
		directory = mkdtempSync(join(tmpdir(), "cgen-file-output-"));
		const path = join(directory, "events.log");
		return {output: new File({fileName: path, ...config}), path};
	}

	function write(output: File, event: Event): Promise<void> {
		return new Promise((resolve, reject) => {
			output._write(event, encoding, (error) => error ? reject(error) : resolve());
		});
	}

	it("writes formatted events to the configured file", async () => {
		const {output, path} = newFileOutput();
		const event: Event = {time: new Date("2026-08-18T12:00:00.000Z"), event: {message: "hello"}};

		await write(output, event);
		output["writeStream"].end();
		await finished(output["writeStream"]);

		expect(readFileSync(path, "utf-8")).toBe(JSON.stringify(event));
	});

	it("invokes the callback after writing an event", async () => {
		const {output} = newFileOutput();
		const event: Event = {time: new Date("2026-08-18T12:00:00.000Z"), event: "hello"};

		await expect(write(output, event)).resolves.toBeUndefined();

		output["writeStream"].end();
		await finished(output["writeStream"]);
	});

	it("rotates automatically before a write would exceed the configured size", async () => {
		const firstEvent: Event = {time: new Date("2026-08-18T12:00:00.000Z"), event: "first"};
		const secondEvent: Event = {time: new Date("2026-08-18T12:01:00.000Z"), event: "second"};
		const firstFormatted = JSON.stringify(firstEvent);
		const {output, path} = newFileOutput({maxFileSize: Buffer.byteLength(firstFormatted)});

		await write(output, firstEvent);
		await write(output, secondEvent);
		output["writeStream"].end();
		await finished(output["writeStream"]);

		expect(readFileSync(`${path}.1`, "utf-8")).toBe(firstFormatted);
		expect(readFileSync(path, "utf-8")).toBe(JSON.stringify(secondEvent));
	});

	it("retains only the configured number of rotated files", async () => {
		const events: Event[] = ["first", "second", "third", "fourth"].map((event, index) => ({
			time: new Date(`2026-08-18T12:0${index}:00.000Z`),
			event
		}));
		const maxFileSize = Buffer.byteLength(JSON.stringify(events[0]));
		const {output, path} = newFileOutput({maxFileSize, maxFiles: 2});

		for (const event of events) {
			await write(output, event);
		}
		output["writeStream"].end();
		await finished(output["writeStream"]);

		expect(readFileSync(path, "utf-8")).toBe(JSON.stringify(events[3]));
		expect(readFileSync(`${path}.1`, "utf-8")).toBe(JSON.stringify(events[2]));
		expect(readFileSync(`${path}.2`, "utf-8")).toBe(JSON.stringify(events[1]));
		expect(() => readFileSync(`${path}.3`)).toThrow();
	});
});
