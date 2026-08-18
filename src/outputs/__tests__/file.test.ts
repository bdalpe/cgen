import {mkdtempSync, readFileSync, rmSync} from "node:fs";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {finished} from "node:stream/promises";
import {afterEach, describe, expect, it, vi} from "vitest";
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

	function newFileOutput(): {output: File; path: string} {
		directory = mkdtempSync(join(tmpdir(), "cgen-file-output-"));
		const path = join(directory, "events.log");
		return {output: new File(path), path};
	}

	it("writes formatted events to the configured file", async () => {
		const {output, path} = newFileOutput();
		const event: Event = {time: new Date("2026-08-18T12:00:00.000Z"), event: {message: "hello"}};

		output._write(event, encoding);
		output["writeStream"].end();
		await finished(output["writeStream"]);

		expect(readFileSync(path, "utf-8")).toBe(JSON.stringify(event));
	});

	it("rotates the active file and its retained files", async () => {
		const {output, path} = newFileOutput();
		const unlink = vi.spyOn(output, "unlink").mockImplementation(() => undefined);
		const rename = vi.spyOn(output, "rename").mockImplementation(() => undefined);

		output.rotate();

		expect(unlink).toHaveBeenCalledWith(`${path}.4`);
		expect(rename).toHaveBeenCalledTimes(4);
		expect(rename).toHaveBeenNthCalledWith(1, `${path}.3`, `${path}.4`);
		expect(rename).toHaveBeenNthCalledWith(2, `${path}.2`, `${path}.3`);
		expect(rename).toHaveBeenNthCalledWith(3, `${path}.1`, `${path}.2`);
		expect(rename).toHaveBeenNthCalledWith(4, path, `${path}.1`);

		output["writeStream"].end();
		await finished(output["writeStream"]);
	});
});
